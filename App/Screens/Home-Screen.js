import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upNext');
  
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()}${getDaySuffix(currentDate.getDate())} ${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;

  function getDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

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
          if (hours !== 12) hours += 12;
        } else {
          minutes = parseInt(timeParts[1]);
        }
      }
    } else {
      hours = parseInt(timeString);
    }
    
    // Convert 12-hour format to 24-hour
    if (isPM && hours !== 12) {
      hours += 12;
    }
    if (!isPM && hours === 12) {
      hours = 0;
    }
    
    // Morning: 6:00 AM - 11:59 AM
    if (hours >= 6 && hours < 12) {
      return 'Morning';
    }
    // Afternoon: 12:00 PM - 3:00 PM
    else if (hours >= 12 && hours < 15) {
      return 'Afternoon';
    }
    // Evening: 3:00 PM - 8:00 PM
    else if (hours >= 15 && hours < 20) {
      return 'Evening';
    }
    // Night: 8:00 PM - 5:59 AM
    else {
      return 'Night';
    }
  };

  // Fetch medications from Firestore
  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) {
          console.error("No user logged in");
          setLoading(false);
          return;
        }

        const medicationsCollection = collection(db, 'users', userId, 'medications');
        const medicationSnapshot = await getDocs(medicationsCollection);
        const medicationList = medicationSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timeOfDay: getTimeOfDay(doc.data().time)
        }));
        setMedications(medicationList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching medications: ", error);
        setLoading(false);
      }
    };

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

  const timeOrder = ['Morning', 'Afternoon', 'Evening', 'Night', 'Other'];

  // Function to get the next medication based on current time
  const getNextMedication = () => {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    
    // Convert current time to minutes since midnight for easier comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    
    // Define time boundaries for each period in minutes
    const morningStart = 6 * 60;   // 6:00 AM
    const afternoonStart = 12 * 60; // 12:00 PM
    const eveningStart = 15 * 60;  // 3:00 PM
    const nightStart = 20 * 60;    // 8:00 PM
    
    // Determine current time period
    let currentPeriod;
    if (currentTimeInMinutes >= morningStart && currentTimeInMinutes < afternoonStart) {
      currentPeriod = 'Morning';
    } else if (currentTimeInMinutes >= afternoonStart && currentTimeInMinutes < eveningStart) {
      currentPeriod = 'Afternoon';
    } else if (currentTimeInMinutes >= eveningStart && currentTimeInMinutes < nightStart) {
      currentPeriod = 'Evening';
    } else {
      currentPeriod = 'Night';
    }
    
    // Get periods in chronological order starting from current period
    const periods = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const currentPeriodIndex = periods.indexOf(currentPeriod);
    const orderedPeriods = [
      ...periods.slice(currentPeriodIndex), 
      ...periods.slice(0, currentPeriodIndex)
    ];
    
    // Find the next available medication
    for (const period of orderedPeriods) {
      if (groupedMedications[period] && groupedMedications[period].length > 0) {
        return {
          medication: groupedMedications[period][0],
          timeOfDay: period
        };
      }
    }
    
    return null;
  };

  const navigateToProfile = () => {
    navigation.navigate('MedicalIDScreen');
    console.log('pressed Profile');
  };

  const handleAdd = () => {
    navigation.navigate('MedTrack');
    console.log('pressed Addmed');
  };

  const navigateToMediVision = () => {
    navigation.navigate('MediVision');
    console.log('pressed MediVision');
  };

  const navigateToMedicationDetail = (medicationId) => {
    navigation.navigate('MedicationDetail', { medicationId });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>MediLens+</Text>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={navigateToProfile}
        >
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>P</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Today's Date Section */}
      <View style={styles.dateSection}>
        <Text style={styles.todayText}>Today</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={activeTab === 'upNext' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setActiveTab('upNext')}
        >
          <Text style={activeTab === 'upNext' ? styles.activeTabText : styles.inactiveTabText}>Up Next</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={activeTab === 'all' ? styles.activeTab : styles.inactiveTab}
          onPress={() => setActiveTab('all')}
        >
          <Text style={activeTab === 'all' ? styles.activeTabText : styles.inactiveTabText}>All</Text>
        </TouchableOpacity>
      </View>

      {/* Medication Cards Section */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your medications...</Text>
        </View>
      ) : medications.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set Up Medication</Text>
          <Text style={styles.cardDescription}>
            All your medications in one place, Set your schedule, check for interactions, and track what you take.
          </Text>
          <TouchableOpacity style={styles.blackButton} onPress={handleAdd}>
            <Text style={styles.buttonText}>Add a Medication</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Next Medication to Take Section */}
          {activeTab === 'upNext' && (
            <View style={styles.nextMedicationSection}>
              
              
              {(() => {
                const nextMed = getNextMedication();
                if (nextMed) {
                  return (
                    <View>
                      <Text style={styles.nextMedicationPeriod}>{nextMed.timeOfDay}</Text>
                      <TouchableOpacity 
                        style={styles.medicationCard}
                        onPress={() => navigateToMedicationDetail(nextMed.medication.id)}
                      >
                        <View style={styles.medicationHeader}>
                          <Text style={styles.medicationName}>{nextMed.medication.name}</Text>
                          <Text style={styles.medicationDosage}>{nextMed.medication.dosage}</Text>
                        </View>
                        
                        <View style={styles.medicationDetailsContainer}>
                          <View style={styles.medicationDetailItem}>
                            <Text style={styles.medicationDetailLabel}>Time</Text>
                            <Text style={styles.medicationDetailText}>{nextMed.medication.time || '9:00 AM'}</Text>
                          </View>
                          <View style={styles.medicationDetailItem}>
                            <Text style={styles.medicationDetailLabel}>Quantity</Text>
                            <Text style={styles.medicationDetailText}>{nextMed.medication.quantity || '1 Capsule'}</Text>
                          </View>
                          <View style={styles.medicationDetailItem}>
                            <Text style={styles.medicationDetailLabel}>Instructions</Text>
                            <Text style={styles.medicationDetailText}>{nextMed.medication.mealOption || 'Before Meal'}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                } else {
                  return (
                    <View style={styles.noUpcomingContainer}>
                      <Text style={styles.noUpcomingText}>No upcoming medications scheduled</Text>
                    </View>
                  );
                }
              })()}
            </View>
          )}

          {/* Display medications based on active tab */}
          
          
          <TouchableOpacity style={styles.addMoreButton} onPress={handleAdd}>
            <Text style={styles.buttonText}>Add More Medications</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Track Your Medication */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Track Your Medication</Text>
        <Text style={styles.cardDescription}>
          Why it's Important to keep up with what you're taking
        </Text>
        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read about it</Text>
        </TouchableOpacity>
      </View>

      {/* Medication Log Section */}
      <Text style={styles.sectionTitle}>Medication Log</Text>

      {/* Daily Logs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Logs</Text>
        <Text style={styles.cardDescription}>
          Log the medications you have taken to keep track of it
        </Text>
      </View>

      {/* MediVision Section */}
      <Text style={styles.sectionTitle}>MediVision</Text>
      <Text style={styles.sectionDescription}>
        Try out out MediVision where it gives information from the package of the medication
      </Text>
      
      <TouchableOpacity 
        style={styles.mediVisionButton} 
        onPress={navigateToMediVision}
      >
        <Text style={styles.buttonText}>MediVision</Text>
      </TouchableOpacity>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    paddingTop: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dateSection: {
    marginVertical: 15,
  },
  todayText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  activeTab: {
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inactiveTab: {
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  inactiveTabText: {
    color: 'black',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 15,
    lineHeight: 22,
  },
  blackButton: {
    backgroundColor: 'black',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 20,
  },
  readMoreButton: {
    alignSelf: 'flex-end',
  },
  readMoreText: {
    color: 'blue',
    fontWeight: '500',
  },
  mediVisionButton: {
    backgroundColor: 'black',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  bottomPadding: {
    height: 30,
  },
  
  // Medication card styles - using exact styles from MedTrack
  timeSection: {
    marginVertical: 10,
    marginBottom: 20,
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
  },
  addMoreButton: {
    backgroundColor: 'black',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 25,
    marginHorizontal: 20,
  },
  
  // Next Medication Section styles
  nextMedicationSection: {
    marginBottom: 25,
  },
  nextMedicationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  nextMedicationPeriod: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
    color: '#555',
  },
  noUpcomingContainer: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noUpcomingText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  }
});

export default HomeScreen