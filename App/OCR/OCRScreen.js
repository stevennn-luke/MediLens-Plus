

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Image, SafeAreaView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { firebase } from '../../config/firebase'; 

export default function OCRScreen({ route, navigation }) {
  const { imageUri } = route.params;
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [medicationInfo, setMedicationInfo] = useState({
    name: '',
  });
  const [error, setError] = useState('');
  const [medicationDetails, setMedicationDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  useEffect(() => {
    const extractText = async () => {
      setLoading(true);
      try {
        // Convert the image to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result.split(',')[1]); 
          };
        });

        // Calling Google Cloud Vision API
        const apiKey = 'AIzaSyCtf2UA4ly08Jpz4ZexKFY2Ts3lY2XFHyE';
        const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
        const requestData = {
          requests: [
            {
              image: {
                content: base64data,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 1,
                },
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
                {
                  type: 'LOGO_DETECTION', 
                  maxResults: 5,
                }
              ],
            },
          ],
        };

        const result = await axios.post(apiUrl, requestData);
        const extractedText = result.data.responses[0].fullTextAnnotation?.text || 'No text found.';
        setRawText(extractedText);

        // Process the extracted text to identify medication
        await identifyMedication(extractedText);
      } catch (error) {
        console.error('OCR Error:', error);
        setError('Failed to extract text from medication label.');
      } finally {
        setLoading(false);
      }
    };

    extractText();
  }, [imageUri]);

  // Identify medication from OCR text
  const identifyMedication = async (text) => {
    setFetchingDetails(true);
    
    try {
      // Create array of lines from the OCR text
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Look for common medication identifiers
      const medicationPatterns = [
        /\b(tablet|tablets|capsule|capsules|mg)\b/i,
        /\b\d+\s*(mg|mcg|ml|g)\b/i,
      ];
      
      // Common medications dictionary
      const commonMedications = [
        { name: 'Azithromycin', genericName: 'Azithromycin', keywords: ['azithromycin', 'azithral', 'zithromax'] },
        { name: 'Amoxicillin', genericName: 'Amoxicillin', keywords: ['amoxicillin', 'amoxil'] },
        { name: 'Doxycycline', genericName: 'Doxycycline', keywords: ['doxycycline', 'vibramycin'] },
        { name: 'Paracetamol', genericName: 'Paracetamol', keywords: ['paracetamol', 'acetaminophen', 'dolo', 'calpol', 'panadol'] },
        { name: 'Ibuprofen', genericName: 'Ibuprofen', keywords: ['ibuprofen', 'brufen', 'advil', 'motrin'] },
        { name: 'Cetirizine', genericName: 'Cetirizine', keywords: ['cetirizine', 'cetrizine', 'zyrtec'] },
        { name: 'Pantoprazole', genericName: 'Pantoprazole', keywords: ['pantoprazole', 'pantocid', 'pantop'] },
        { name: 'Metformin', genericName: 'Metformin', keywords: ['metformin', 'glucophage'] },
        { name: 'Atorvastatin', genericName: 'Atorvastatin', keywords: ['atorvastatin', 'lipitor'] },
        { name: 'Losartan', genericName: 'Losartan', keywords: ['losartan', 'cozaar'] }
      ];
      
      const normalizedText = text.toLowerCase();
      
      // Check for common medications first
      for (const med of commonMedications) {
        if (med.keywords.some(keyword => normalizedText.includes(keyword))) {
          console.log(`Found known medication: ${med.name}`);
          
          // Extract dosage if present
          let dosage = '';
          const dosageMatch = text.match(/\b(\d+)\s*(mg|mcg|g|ml)\b/i);
          if (dosageMatch) {
            dosage = dosageMatch[0];
          }
          
          const medicationName = dosage ? `${med.name} ${dosage}` : med.name;
          setMedicationInfo({ name: medicationName });
          
          // Get manufacturer if present
          let manufacturer = 'Unknown';
          const manufacturerMatch = text.match(/by\s+([A-Za-z\s]+(?:Ltd|Limited|Inc|Pharma|Pharmaceutical))/i);
          if (manufacturerMatch) {
            manufacturer = manufacturerMatch[1].trim();
          }
          
          // Look for manufacturer elsewhere in the text
          if (manufacturer === 'Unknown') {
            const pharmaMatch = text.match(/([A-Za-z\s]+(?:Pharma|Pharmaceutical|Labs|Laboratories)[A-Za-z\s]*(?:Ltd|Limited|Inc)?)/i);
            if (pharmaMatch) {
              manufacturer = pharmaMatch[1].trim();
            }
          }
          
          setMedicationDetails({
            brandName: medicationName,
            genericName: med.genericName,
            activeIngredient: med.genericName,
            indications: await getMedicationIndications(med.name),
            manufacturer: manufacturer
          });
          
          setFetchingDetails(false);
          return;
        }
      }
      
      // If no common medication found, use improved heuristic search
      const bestCandidate = findBestMedicationCandidate(lines);
      
      if (bestCandidate) {
        setMedicationInfo({ name: bestCandidate.name });
        
        // Extract other information
        const genericMatch = text.match(/\b(?:generic|composition)[:]*\s*([A-Za-z\s-]+)/i);
        const genericName = genericMatch ? genericMatch[1].trim() : 'Unknown';
        
        const manufacturerMatch = text.match(/(?:mfd|manufactured|marketed)\s*by[:]*\s*([A-Za-z\s]+(?:Ltd|Limited|Inc|Pharma|Pharmaceutical))/i);
        const manufacturer = manufacturerMatch ? manufacturerMatch[1].trim() : 'Unknown';
        
        // Look for manufacturer elsewhere in the text
        let finalManufacturer = manufacturer;
        if (finalManufacturer === 'Unknown') {
          const pharmaMatch = text.match(/([A-Za-z\s]+(?:Pharma|Pharmaceutical|Labs|Laboratories)[A-Za-z\s]*(?:Ltd|Limited|Inc)?)/i);
          if (pharmaMatch) {
            finalManufacturer = pharmaMatch[1].trim();
          }
        }
        
        setMedicationDetails({
          brandName: bestCandidate.name,
          genericName: genericName,
          activeIngredient: genericName,
          indications: 'Unknown',
          manufacturer: finalManufacturer
        });
      } else {
        await checkWithRxNavAndUpdateDetails(text);
      }
    } catch (error) {
      console.error('Error identifying medication:', error);
      setMedicationInfo({ name: 'Unknown Medication' });
      setMedicationDetails({
        brandName: 'Unknown',
        genericName: 'Unknown',
        activeIngredient: 'Unknown',
        indications: 'Unknown',
        manufacturer: 'Unknown',
      });
    } finally {
      setFetchingDetails(false);
    }
  };

  // Find the most likely medication name with improved adjacent line checking
  const findBestMedicationCandidate = (lines) => {
    // Improved approach to check adjacent lines for context
    let candidateScores = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length < 3) continue;
      
      let score = 0;
      
      // Check for medication name endings
      const medicationNameWords = ['cin', 'mycin', 'cillin', 'oxacin', 'dronate', 'vastatin', 'sartan',
        'pril', 'olol', 'dipine', 'lamide', 'prazole', 'thiazide'];
      
      for (const word of medicationNameWords) {
        if (line.toLowerCase().includes(word)) {
          score += 10;
          break;
        }
      }
      
      // Check for medication indicators
      const medicationIndicators = [
        /\b(tablet|tablets|capsule|capsules)\b/i,
        /\b\d+\s*(mg|mcg|ml|g)\b/i,
        /\b(oral|injection|suspension|syrup)\b/i,
      ];
      
      for (const pattern of medicationIndicators) {
        if (pattern.test(line)) {
          score += 5;
        }
      }
      
      // Specifically check for dosage patterns - KEY IMPROVEMENT
      const hasDosage = /\b\d+\s*(mg|mcg|ml|g)\b/i.test(line);
      if (hasDosage) {
        score += 8;
        
        // Check line above for potential medication name (KEY IMPROVEMENT)
        if (i > 0) {
          const prevLine = lines[i-1].trim();
          // Previous line might contain the medication name if this line only has dosage
          if (prevLine.length > 3 && 
              !/\b\d+\s*(mg|mcg|ml|g)\b/i.test(prevLine) &&
              !/\b(road|street|avenue|lane|district|state|pin|regd|off)\b/i.test(prevLine.toLowerCase())) {
            
            candidateScores.push({ 
              line: `${prevLine} ${line}`, 
              score: score + 15,  // Boost score for combined name + dosage
              index: i-1
            });
          }
        }
      }
      
      // Uppercase words are often brand names
      if (/^[A-Z]/.test(line) && !/^[A-Z\s]+$/.test(line)) {
        score += 3;
      }
      
      // If IP or BP appears, likely a medication standard
      if (/\b(IP|BP|USP)\b/.test(line)) {
        score += 5;
      }
      
      // Avoid location information and addresses
      if (/\b(road|street|avenue|lane|district|state|pin|regd|off)\b/i.test(line.toLowerCase())) {
        score -= 10;
      }
      
      // Lines at the beginning of the text are more likely to be medication names
      score += Math.max(0, 5 - i);
      
      candidateScores.push({ line, score, index: i });
    }
    
    // Sort by score, highest first
    candidateScores.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring candidate if its score is significant
    if (candidateScores.length > 0 && candidateScores[0].score > 10) {
      // Extract just the medication name (remove excessive info)
      let name = candidateScores[0].line;
      
      // Clean up the name - remove common extras but preserve dosage info
      name = name.replace(/tablet(s)?|capsule(s)?|IP|BP|USP/gi, '').trim();
      
      // Make sure dosage is included if not already
      if (!/\b\d+\s*(mg|mcg|ml|g)\b/i.test(name)) {
        // Look for dosage in adjacent lines
        const index = candidateScores[0].index;
        
        // Check if we have a next line
        if (index + 1 < lines.length) {
          const nextLine = lines[index + 1].trim();
          const dosageMatch = nextLine.match(/\b\d+\s*(mg|mcg|ml|g)\b/i);
          if (dosageMatch && !/\b(road|street|avenue|lane|district|state|pin|regd|off)\b/i.test(nextLine.toLowerCase())) {
            name = `${name} ${dosageMatch[0]}`;
          }
        }
      }
      
      return { name };
    }
    
    return null;
  };

  // Get medication indications/uses
  const getMedicationIndications = async (medicationName) => {
    const medicationUses = {
      'Azithromycin': 'Antibiotic used for bacterial infections',
      'Amoxicillin': 'Antibiotic used for bacterial infections',
      'Doxycycline': 'Antibiotic used for bacterial infections and malaria prevention',
      'Paracetamol': 'Pain reliever and fever reducer',
      'Ibuprofen': 'Nonsteroidal anti-inflammatory drug (NSAID) for pain and inflammation',
      'Cetirizine': 'Antihistamine for allergy relief',
      'Pantoprazole': 'Proton pump inhibitor for reducing stomach acid',
      'Metformin': 'Antidiabetic medication for type 2 diabetes',
      'Atorvastatin': 'Statin medication for lowering cholesterol',
      'Losartan': 'Angiotensin II receptor blocker for high blood pressure'
    };
    
    return medicationUses[medicationName] || 'Unknown';
  };

  // Validate medication with RxNav API
  const checkWithRxNavAndUpdateDetails = async (text) => {
    try {
      // Extract potential medication names from text
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 3);
      
      // Try each line as a potential medication name
      for (const line of lines) {
        // Skip lines that look like addresses or locations
        if (/\b(road|street|lane|district|state|pin|regd|off)\b/i.test(line.toLowerCase())) {
          continue;
        }
        
        const encodedName = encodeURIComponent(line);
        const rxNavUrl = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodedName}`;
        
        const rxResponse = await axios.get(rxNavUrl);
        
        if (rxResponse.data && 
            rxResponse.data.drugGroup && 
            rxResponse.data.drugGroup.conceptGroup) {
          
          const concepts = rxResponse.data.drugGroup.conceptGroup;
          let drugInfo = null;
          
          // Find the first group with drugs
          for (const group of concepts) {
            if (group.conceptProperties && group.conceptProperties.length > 0) {
              drugInfo = group.conceptProperties[0];
              break;
            }
          }
          
          if (drugInfo) {
            // Get details using the RxCUI
            await fetchAndSetMedicationDetails(drugInfo);
            return true;
          }
        }
      }
      
      // If no results found through RxNav, use heuristics
      const bestGuessName = guessMedicationName(text);
      setMedicationInfo({ name: bestGuessName });
      
      // Set generic details
      setMedicationDetails({
        brandName: bestGuessName,
        genericName: 'Not found in medication database',
        activeIngredient: 'Unknown',
        indications: 'Unknown',
        manufacturer: extractManufacturer(text),
      });
      
      return false;
    } catch (error) {
      console.error(`Error checking medication with RxNav`, error);
      
      const bestGuessName = guessMedicationName(text);
      setMedicationInfo({ name: bestGuessName });
      
      setMedicationDetails({
        brandName: bestGuessName,
        genericName: 'Not found in medication database',
        activeIngredient: 'Unknown',
        indications: 'Unknown',
        manufacturer: extractManufacturer(text),
      });
      
      return false;
    }
  };

  // Extract manufacturer
  const extractManufacturer = (text) => {
    const manufacturerMatch = text.match(/(?:mfd|manufactured|marketed)\s*by[:]*\s*([A-Za-z\s]+(?:Ltd|Limited|Inc|Pharma|Pharmaceutical))/i);
    if (manufacturerMatch) {
      return manufacturerMatch[1].trim();
    }
    
    const pharmaMatch = text.match(/([A-Za-z\s]+(?:Pharma|Pharmaceutical|Labs|Laboratories)[A-Za-z\s]*(?:Ltd|Limited|Inc)?)/i);
    if (pharmaMatch) {
      return pharmaMatch[1].trim();
    }
    
    return 'Unknown';
  };

  // Guess medication name - improved to check line context
  const guessMedicationName = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 3);
    
    // Build a combined view of lines to better understand context
    let combinedLines = [];
    for (let i = 0; i < lines.length - 1; i++) {
      // Check for dosage in current line with name in previous line
      if (/\b\d+\s*(mg|mcg|ml|g)\b/i.test(lines[i]) && i > 0) {
        const prevLine = lines[i-1].trim();
        if (!/\b(road|street|lane|district|state|pin|regd|off)\b/i.test(prevLine.toLowerCase())) {
          combinedLines.push(`${prevLine} ${lines[i]}`);
        }
      }
      
      // Add current line 
      combinedLines.push(lines[i]);
    }
    
    // Add last line
    if (lines.length > 0) {
      combinedLines.push(lines[lines.length - 1]);
    }
    
    // Check for lines with mg/dosage info (prioritize combined lines)
    for (const line of combinedLines) {
      if (/\b\d+\s*(mg|mcg|ml|g)\b/i.test(line) && 
          !/\b(road|street|lane|district|state|pin|regd|off)\b/i.test(line.toLowerCase())) {
        return line.trim();
      }
    }
    
    // Check for lines with tablet/capsule
    for (const line of combinedLines) {
      if (/\b(tablet|capsule|solution|suspension|syrup)\b/i.test(line) && 
          !/\b(road|street|lane|district|state|pin|regd|off)\b/i.test(line.toLowerCase())) {
        return line.trim();
      }
    }
    
    // Last resort: Look for line with a common medication suffix
    const commonSuffixes = ['cin', 'mycin', 'cillin', 'oxacin', 'vastatin', 'sartan', 'pril', 'olol', 'dipine'];
    for (const line of combinedLines) {
      const lowerLine = line.toLowerCase();
      if (commonSuffixes.some(suffix => lowerLine.includes(suffix)) && 
          !/\b(road|street|lane|district|state|pin|regd|off)\b/i.test(lowerLine)) {
        return line.trim();
      }
    }
    
    return 'Unknown Medication';
  };

  // Fetch detailed medication information using RxCUI
  const fetchAndSetMedicationDetails = async (drugInfo) => {
    try {
      const confirmedName = drugInfo.name;
      let activeIngredient = 'Unknown';
      let className = 'Unknown';
      
      // Try to get active ingredients
      try {
        const ingredientUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${drugInfo.rxcui}/related.json?tty=IN`;
        const ingredientResponse = await axios.get(ingredientUrl);
        
        if (ingredientResponse.data && 
            ingredientResponse.data.relatedGroup &&
            ingredientResponse.data.relatedGroup.conceptGroup) {
          
          const ingredients = ingredientResponse.data.relatedGroup.conceptGroup
            .filter(group => group.tty === 'IN')
            .flatMap(group => group.conceptProperties || []);
            
          if (ingredients.length > 0) {
            activeIngredient = ingredients.map(ing => ing.name).join(', ');
          }
        }
      } catch (ingredientError) {
        console.error('Error fetching ingredients:', ingredientError);
      }
      
      // Try to get medication class
      try {
        const rxClassUrl = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json?drugName=${encodeURIComponent(confirmedName)}&relaSource=MEDRT`;
        
        const classResponse = await axios.get(rxClassUrl);
        if (classResponse.data && 
            classResponse.data.rxclassDrugInfoList && 
            classResponse.data.rxclassDrugInfoList.rxclassDrugInfo &&
            classResponse.data.rxclassDrugInfoList.rxclassDrugInfo.length > 0) {
          
          className = classResponse.data.rxclassDrugInfoList.rxclassDrugInfo[0].rxclassMinConceptItem.className;
        }
      } catch (classError) {
        console.error('Error fetching class info:', classError);
      }
      
      setMedicationInfo({ name: confirmedName });
      
      setMedicationDetails({
        brandName: confirmedName,
        genericName: drugInfo.synonym || confirmedName,
        activeIngredient: activeIngredient,
        indications: className,
        manufacturer: extractManufacturer(rawText),
      });
    } catch (error) {
      console.error('Error fetching detailed medication information:', error);
      
      setMedicationInfo({ name: drugInfo.name });
      
      setMedicationDetails({
        brandName: drugInfo.name,
        genericName: drugInfo.synonym || drugInfo.name,
        activeIngredient: 'Unknown',
        indications: 'Unknown',
        manufacturer: extractManufacturer(rawText),
      });
    }
  };

  // Save medication information to Firestore
  const saveMedicationToFirestore = async () => {
    try {
      if (!medicationInfo.name || medicationInfo.name === 'Unknown Medication') {
        Alert.alert('Error', 'Cannot save unknown medication. Please try again with a clearer image.');
        return;
      }
      
      const medicationData = {
        imageUri: imageUri,
        name: medicationInfo.name,
        genericName: medicationDetails?.genericName || 'Unknown',
        activeIngredient: medicationDetails?.activeIngredient || 'Unknown',
        indications: medicationDetails?.indications || 'Unknown',
        manufacturer: medicationDetails?.manufacturer || 'Unknown',
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      };
      
      // Get current user ID
      const userId = firebase.auth().currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to save medications.');
        return;
      }
      
      // Save to Firestore
      await firebase.firestore()
        .collection('users')
        .doc(userId)
        .collection('OCRmedications')
        .add(medicationData);
      
      Alert.alert(
        'Success',
        'Medication has been added to your list.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              navigation.setParams({ newMedication: medicationData });
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving medication to Firestore:', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    }
  };

  const goBackWithMedicationInfo = () => {
    if (medicationInfo.name) {
      const medicationData = {
        imageUri: imageUri,
        name: medicationInfo.name,
        genericName: medicationDetails?.genericName,
        activeIngredient: medicationDetails?.activeIngredient,
        indications: medicationDetails?.indications,
        manufacturer: medicationDetails?.manufacturer,
        timestamp: new Date().toISOString(),
      };
      
      navigation.setParams({ newMedication: medicationData });
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  const windowHeight = Dimensions.get('window').height;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackWithMedicationInfo}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MediVision</Text>
      </View>
      
      {loading ? (
        <View style={[styles.loadingContainer, { height: windowHeight * 0.8 }]}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Analyzing medication label...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.resultContainer}>
            {/* Original Image & Extracted Text section */}
            <Text style={styles.sectionTitle}>Original Image & Extracted Text</Text>
            <View style={styles.imageTextContainer}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.medicationImage} 
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.rawTextContainerSide}>
                <Text style={styles.rawText}>{rawText}</Text>
              </View>
            </View>
            
            {/* Medication Information section */}
            <Text style={styles.sectionTitle}>Medication Information</Text>
            
            {fetchingDetails ? (
              <View style={styles.fetchingContainer}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.loadingText}>Validating medication and loading details...</Text>
              </View>
            ) : (
              <>
                <View style={styles.infoSection}>
                  <Text style={styles.label}>Medication Name:</Text>
                  <Text style={styles.value}>{medicationInfo.name || 'Not detected'}</Text>
                </View>
                
                {medicationDetails && (
                  <>
                    <View style={styles.infoSection}>
                      <Text style={styles.label}>Generic Name:</Text>
                      <Text style={styles.value}>{medicationDetails.genericName}</Text>
                    </View>
                    
                    <View style={styles.infoSection}>
                      <Text style={styles.label}>Active Ingredient:</Text>
                      <Text style={styles.value}>{medicationDetails.activeIngredient}</Text>
                    </View>
                    
                    <View style={styles.infoSection}>
                      <Text style={styles.label}>Category/Used For:</Text>
                      <Text style={styles.value}>{medicationDetails.indications}</Text>
                    </View>
                    
                    <View style={styles.infoSection}>
                      <Text style={styles.label}>Manufacturer:</Text>
                      <Text style={styles.value}>{medicationDetails.manufacturer}</Text>
                    </View>
                  </>
                )}
                
                {/* Add Medication Button */}
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={saveMedicationToFirestore}
                >
                  <Text style={styles.addButtonText}>Add Medication</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fetchingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 'auto',
    marginRight: 20,
  },
  resultContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
  },
  infoSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  imageTextContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  medicationImage: {
    width: '100%',
    height: 200,
    borderRadius: 6,
  },
  rawTextContainerSide: {
    flex: 1,
    padding: 16,
    maxHeight: 200,
  },
  rawText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});