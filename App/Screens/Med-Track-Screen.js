import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase'; 
import { useFocusEffect } from '@react-navigation/native';

const MedTrack = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTimeOfDay = (timeString) => {
    if (!timeString) return 'Other';
    
    let hours = 0;
    let minutes = 0;
    let isPM = false;
    
    if (timeString.includes(':')) {
      const timeParts = timeString.split(':');
      hours = parseInt(timeParts[0]);
      
      if (timeParts[1]) {
        if (timeParts[1].includes('AM')) {
          minutes = parseInt(timeParts[1].split(' ')[0]);
          isPM = false;
        } else if (timeParts[1].includes('PM')) {
          minutes = parseInt(timeParts[1].split(' ')[0]);
          isPM = true;
          // Only add 12 if it's 1pm-11pm (don't add for 12pm)
          if (hours < 12) hours += 12;
        } else {
          minutes = parseInt(timeParts[1]);
        }
      }
    } else {
      // Try to parse the entire string as a time
      try {
        hours = parseInt(timeString);
      } catch (error) {
        console.error("Invalid time format:", timeString);
        return 'Other';
      }
    }
    
    // Convert 12-hour format to 24-hour if needed
    if (isPM && hours < 12) {
      hours += 12;
    }
    if (!isPM && hours === 12) {
      hours = 0;
    }
    
    // Morning: 6:00 AM - 11:59 AM
    if (hours >= 6 && hours < 12) {
      return 'Morning';
    }
    // Afternoon: 12:00 PM - 3:00 PM (15:00)
    else if (hours >= 12 && hours < 15) {
      return 'Afternoon';
    }
    // Evening: 3:00 PM - 8:00 PM (15:00 - 20:00)
    else if (hours >= 15 && hours < 20) {
      return 'Evening';
    }
    // Night: 8:00 PM - 5:59 AM (20:00 - 5:59)
    else {
      return 'Night';
    }
  };

  // Helper function to convert time string to minutes for sorting
  const timeToMinutes = (timeString) => {
    if (!timeString) return 0;
    
    let hours = 0;
    let minutes = 0;
    let isPM = false;
    
    if (timeString.includes(':')) {
      const timeParts = timeString.split(':');
      hours = parseInt(timeParts[0]);
      
      if (timeParts[1]) {
        if (timeParts[1].includes('AM')) {
          minutes = parseInt(timeParts[1].split(' ')[0]);
          isPM = false;
        } else if (timeParts[1].includes('PM')) {
          minutes = parseInt(timeParts[1].split(' ')[0]);
          isPM = true;
          if (hours < 12) hours += 12;
        } else {
          minutes = parseInt(timeParts[1]);
        }
      }
    } else {
      try {
        hours = parseInt(timeString);
      } catch (error) {
        return 0;
      }
    }
    
    // Convert 12-hour format to 24-hour
    if (isPM && hours < 12) {
      hours += 12;
    }
    if (!isPM && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  // Function to fetch medications
  const fetchMedications = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) {
        console.error("No user logged in");
        setLoading(false);
        return;
      }

      const medicationsCollection = collection(db, 'users', userId, 'medications');
      const medicationSnapshot = await getDocs(medicationsCollection);
      
      if (medicationSnapshot.empty) {
        console.log("No medications found in the collection");
        setMedications([]);
        setLoading(false);
        return;
      }

      const medicationList = medicationSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Medication data:", data); // Debug: Log each medication
        
        // Calculate time of day
        const timeOfDay = getTimeOfDay(data.time);
        
        return {
          id: doc.id,
          ...data,
          timeOfDay: timeOfDay,
          // Store minutes for sorting
          timeInMinutes: timeToMinutes(data.time)
        };
      });
      
      // Sort the entire medication list by time
      medicationList.sort((a, b) => a.timeInMinutes - b.timeInMinutes);
      
      console.log("Processed medications:", medicationList); // Debug: Log processed data
      setMedications(medicationList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching medications: ", error);
      setLoading(false);
    }
  };

  // Use useFocusEffect to reload data whenever the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused, fetching medications..."); // Debug
      fetchMedications();
      return () => {
        // Do any cleanup if needed
      };
    }, [])
  );

  // Initial load
  useEffect(() => {
    fetchMedications();
  }, []);

  // Group medications by time of day
  const groupedMedications = medications.reduce((groups, med) => {
    const timeOfDay = med.timeOfDay || 'Other';
    if (!groups[timeOfDay]) {
      groups[timeOfDay] = [];
    }
    groups[timeOfDay].push(med);
    return groups;
  }, { Morning: [], Afternoon: [], Evening: [], Night: [], Other: [] });

  // Sort medications in each group by time
  Object.keys(groupedMedications).forEach(key => {
    groupedMedications[key].sort((a, b) => a.timeInMinutes - b.timeInMinutes);
  });

  const timeOrder = ['Morning', 'Afternoon', 'Evening', 'Night', 'Other'];
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Back button and header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MediLens+</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your medications...</Text>
          </View>
        ) : medications.length === 0 ? (
          <>
            {/* Setup Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Set Up Medication</Text>
              
              <View style={styles.featureList}>
                <Text style={styles.featureText}>Track all your medications in one place</Text>
                <Text style={styles.featureText}>Set a Schedule and get reminders</Text>
                <Text style={styles.featureText}>Learn about the medication</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  navigation.navigate('AddMed');
                }}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {/* Navigation buttons */}
            <View style={styles.navButtonsContainer}>
              <TouchableOpacity style={styles.navButtonPrimary}>
                <Text style={styles.navButtonPrimaryText}>Up Next</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButtonSecondary}>
                <Text style={styles.navButtonSecondaryText}>All</Text>
              </TouchableOpacity>
            </View>
            
            {/* No Meds Message */}
            <View style={styles.noMedsContainer}>
              <Text style={styles.noMedsText}>No Meds Added</Text>
            </View>
          </>
        ) : (
          <>
            {/* Medications View */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.actionButtonSecondary}>
                <Text style={styles.actionButtonSecondaryText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButtonPrimary}
                onPress={() => navigation.navigate('AddMed')}
              >
                <Text style={styles.actionButtonPrimaryText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {/* Medication List by Time of Day */}
            {timeOrder.map(timeOfDay => {
              if (groupedMedications[timeOfDay] && groupedMedications[timeOfDay].length > 0) {
                return (
                  <View key={timeOfDay} style={styles.timeSection}>
                    <Text style={styles.timeSectionTitle}>{timeOfDay}</Text>
                    
                    {groupedMedications[timeOfDay].map(med => (
                      <TouchableOpacity 
                        key={med.id} 
                        style={styles.medicationCard}
                        onPress={() => navigation.navigate('MedicationDetail', { medicationId: med.id })}
                      >
                        <View style={styles.medicationHeader}>
                          <Text style={styles.medicationName}>
                            {med.medicationName || "Unnamed Medication"}
                          </Text>
                          <Text style={styles.medicationDosage}>
                            {med.dosage || "No dosage specified"}
                          </Text>
                        </View>
                        
                        <View style={styles.medicationDetailsContainer}>
                          <View style={styles.medicationDetailItem}>
                            <Text style={styles.medicationDetailLabel}>Time</Text>
                            <Text style={styles.medicationDetailText}>{med.time || '9:00 AM'}</Text>
                          </View>
                          <View style={styles.medicationDetailItem}>
                            <Text style={styles.medicationDetailLabel}>Quantity</Text>
                            <Text style={styles.medicationDetailText}>{med.quantity || '1 Capsule'}</Text>
                          </View>
                          <View style={styles.medicationDetailItem}>
                            <Text style={styles.medicationDetailLabel}>Instructions</Text>
                            <Text style={styles.medicationDetailText}>{med.mealOption || 'Before Meal'}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }
              return null;
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Styles remain unchanged
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  
  section: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    margin: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 30,
  },
  featureText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    margin: 20,
  },
  navButtonPrimary: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginRight: 10,
  },
  navButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navButtonSecondary: {
    backgroundColor: '#D3D3D3',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginLeft: 10,
  },
  navButtonSecondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noMedsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  noMedsText: {
    fontSize: 16,
    color: '#666',
  },
  
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  actionButtonSecondary: {
    backgroundColor: '#D3D3D3',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginRight: 10,
  },
  actionButtonSecondaryText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonPrimary: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginLeft: 10,
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeSection: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  timeSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  medicationCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  medicationHeader: {
    padding: 15,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  medicationDosage: {
    fontSize: 16,
    color: '#444',
    marginTop: 5,
  },
  medicationDetailsContainer: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
  },
  medicationDetailItem: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  medicationDetailText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  }
});

export default MedTrack;