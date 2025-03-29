import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, 
  Image, 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export default function MediVision({ navigation, route }) {
  const [scannedMedications, setScannedMedications] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Reference to the medications collection
  const medicationsCollectionRef = collection(db, 'OCR Medications');

  useEffect(() => {
    loadScannedMedications();
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      loadScannedMedications();
      return () => {}; 
    }, [])
  );
 
  useEffect(() => {
    if (route.params?.newMedication) {
      addNewMedication(route.params.newMedication);
    }
  }, [route.params?.newMedication]);

  const loadScannedMedications = async () => {
    try {
      // Create a query with orderBy
      const medicationsQuery = query(
        medicationsCollectionRef,
        orderBy('createdAt', 'desc')
      );
      
      // Get documents
      const querySnapshot = await getDocs(medicationsQuery);
      
      // Map documents to array with IDs
      const medications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setScannedMedications(medications);
      setRefreshKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error('Error loading medications from Firebase:', error);
      Alert.alert('Error', 'Could not load your medication history.');
    }
  };
  
  const addNewMedication = async (medication) => {
    try {
      // Add timestamp to medication data
      const medicationWithTimestamp = {
        ...medication,
        createdAt: serverTimestamp()
      };
      
      // Add document to collection
      await addDoc(medicationsCollectionRef, medicationWithTimestamp);
      
      // Reload medications
      loadScannedMedications();
    } catch (error) {
      console.error('Error adding medication to Firebase:', error);
      Alert.alert('Error', 'Could not save the medication information.');
    }
  };
  
  const deleteMedication = (id) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Create reference to the specific document
              const medicationDocRef = doc(db, 'OCR Medications', id);
              
              // Delete the document
              await deleteDoc(medicationDocRef);
              
              // Reload medications
              loadScannedMedications();
              
              Alert.alert('Success', 'Medication deleted successfully.');
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Could not delete the medication.');
            }
          }
        }
      ]
    );
  };
  
  const takePhoto = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled) {
        navigation.navigate('OCR', { imageUri: result.assets[0].uri });
      }
    }
  };
  
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled) {
      navigation.navigate('OCRScreen', { imageUri: result.assets[0].uri });
    }
  };
  
  const showImageOptions = () => {
    Alert.alert(
      'Choose an option',
      'How would you like to add an image?',
      [
        { text: 'Take a Picture', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.medicationItem}
      onPress={() => navigation.navigate('OCR', { 
        imageUri: item.imageUri,
        existingData: item
      })}
      onLongPress={() => deleteMedication(item.id)}
      delayLongPress={500}
    >
      <Image source={{ uri: item.imageUri }} style={styles.medicationImage} />
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.name || 'Unknown Medication'}</Text>
        <Text style={styles.medicationDetails}>
          {item.genericName || 'Generic name not available'}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => navigation.navigate('OCR', { 
          imageUri: item.imageUri,
          existingData: item
        })}
      >
        <Text style={styles.viewDetailsText}>View</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
          <ScrollView style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MediVision</Text>
      </View>
      
      {/* MediVision Card */}
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.cardDescription}>
            MediVision makes identifying medication a breeze. Just snap a photo and instantly know what you're taking. No more squinting at tiny labels or confusion information about your pills on the Internet.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.cardButton} 
          onPress={showImageOptions}
        >
          <Text style={styles.cardButtonText}>Try MediVision</Text>
        </TouchableOpacity>
      </View>
      
      {/* Medication History */}
      {scannedMedications.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyTitle}>History</Text>
          <Text style={styles.longPressHint}>Long press to delete an item</Text>
          <FlatList
            data={scannedMedications}
            renderItem={renderMedicationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.medicationList}
            extraData={refreshKey}
          />
        </View>
      )}
      
      {scannedMedications.length === 0 && (
        <View style={styles.emptyHistoryContainer}>
          <Ionicons name="medical" size={50} color="#ccc" />
          <Text style={styles.emptyHistoryText}>No medications scanned yet</Text>
          <Text style={styles.emptyHistorySubtext}>
            Add your first medication by tapping the "Try MediVision" button above
          </Text>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#000',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    alignItems: 'left',
    marginBottom: 20,
  },
  cardDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'left',
    lineHeight: 22,
  },
  cardButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start', 
  },
  cardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  longPressHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    fontStyle: 'italic'
  },
  medicationList: {
    paddingBottom: 20,
  },
  medicationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  medicationImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  medicationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  viewDetailsButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewDetailsText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyHistoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyHistoryText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    color: '#555',
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: '80%',
  },
});