import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, doc, setDoc, addDoc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import * as Notifications from 'expo-notifications';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const HomeScreen = () => {
  const navigation = useNavigation();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upNext');
  const [medicationLogs, setMedicationLogs] = useState({});
  
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()}${getDaySuffix(currentDate.getDate())} ${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;

  // Request notification permissions
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
      }
    })();
  }, []);

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

  // Get today's date at midnight for comparing logs
  const getTodayAtMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

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

  // Convert time string to minutes since midnight for comparison
  const timeToMinutes = (timeString) => {
    if (!timeString) return -1;
    
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
      try {
        hours = parseInt(timeString);
      } catch (error) {
        console.error("Invalid time format:", timeString);
        return -1;
      }
    }
    
    // Convert 12-hour format to 24-hour if needed
    if (isPM && hours < 12) {
      hours += 12;
    }
    if (!isPM && hours === 12) {
      hours = 0;
    }
    
    return hours * 60 + minutes;
  };

  // Schedule notification for a medication
  const scheduleNotification = async (medication) => {
    try {
      const timeInMinutes = timeToMinutes(medication.time);
      if (timeInMinutes === -1) return;
      
      // Get notify setting, default to 15 minutes if not specified
      let notifyMinutesBefore = 15;
      
      if (medication.notify && medication.notify.trim() !== '') {
        // Try to parse the notify time
        const notifyMatch = medication.notify.match(/(\d+)\s*(?:minute|min|m)?s?/i);
        if (notifyMatch && notifyMatch[1]) {
          notifyMinutesBefore = parseInt(notifyMatch[1]);
        }
      }
      
      // Calculate notification time
      const now = new Date();
      let notificationDate = new Date();
      let notificationMinutes = timeInMinutes - notifyMinutesBefore;
      
      // If the notification time has already passed today, schedule for tomorrow
      if (notificationMinutes < (now.getHours() * 60 + now.getMinutes())) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }
      
      // Set the correct time for notification
      notificationDate.setHours(Math.floor(notificationMinutes / 60));
      notificationDate.setMinutes(notificationMinutes % 60);
      notificationDate.setSeconds(0);
      
      // Cancel any existing notifications for this medication
      await cancelMedicationNotification(medication.id);
      
      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take ${medication.medicationName || medication.name} in ${notifyMinutesBefore} minutes`,
          data: { medicationId: medication.id },
        },
        trigger: notificationDate,
      });
      
      // Save notification ID to Firestore for reference
      const userId = auth.currentUser.uid;
      const notificationRef = doc(db, 'users', userId, 'medications', medication.id);
      await setDoc(notificationRef, { 
        notificationId: notificationId,
        notifyMinutesBefore: notifyMinutesBefore
      }, { merge: true });
      
      console.log(`Notification scheduled for ${medication.medicationName || medication.name} at ${notificationDate.toLocaleTimeString()} (${notifyMinutesBefore} min before)`);
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  // Cancel notification for a medication
  const cancelMedicationNotification = async (medicationId) => {
    try {
      const userId = auth.currentUser.uid;
      const medicationRef = doc(db, 'users', userId, 'medications', medicationId);
      const medicationDoc = await getDoc(medicationRef);
      
      if (medicationDoc.exists() && medicationDoc.data().notificationId) {
        await Notifications.cancelScheduledNotificationAsync(medicationDoc.data().notificationId);
      }
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  };

  // Record medication as taken
  const recordMedicationTaken = async (medication) => {
    try {
      const userId = auth.currentUser.uid;
      const takenAt = new Date();
      
      // Add to medication logs collection
      const logRef = await addDoc(collection(db, 'users', userId, 'medicationLogs'), {
        medicationId: medication.id,
        medicationName: medication.medicationName || medication.name,
        takenAt: takenAt,
        dosage: medication.dosage,
        scheduled: medication.time
      });
      
      console.log(`Recorded ${medication.medicationName || medication.name} as taken at ${takenAt.toLocaleString()}`);
      
      // Update our local state to reflect the change
      setMedicationLogs(prevLogs => ({
        ...prevLogs,
        [medication.id]: {
          ...prevLogs[medication.id],
          takenToday: true,
          lastTakenAt: takenAt
        }
      }));
      
      // Cancel the notification for this medication
      await cancelMedicationNotification(medication.id);
      
      // Schedule next notification for tomorrow
      await scheduleNotification(medication);
      
      Alert.alert(
        "Medication Taken",
        `You've recorded ${medication.medicationName || medication.name} as taken.`
      );
    } catch (error) {
      console.error("Error recording medication as taken:", error);
      Alert.alert("Error", "Could not record medication as taken. Please try again.");
    }
  };

  // Fetch medication logs to determine which medications have been taken today
  const fetchMedicationLogs = async () => {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) return;

      const today = getTodayAtMidnight();
      const logsCollection = collection(db, 'users', userId, 'medicationLogs');
      
      // Get logs for today
      const todayLogs = await getDocs(logsCollection);
      
      
      const newMedicationLogs = {};
      
      todayLogs.docs.forEach(doc => {
        const logData = doc.data();
        const logDate = logData.takenAt.toDate ? logData.takenAt.toDate() : new Date(logData.takenAt);
        
        
        const isTodayLog = logDate >= today;
        
        
        if (!newMedicationLogs[logData.medicationId]) {
          newMedicationLogs[logData.medicationId] = {
            takenToday: isTodayLog,
            lastTakenAt: logDate
          };
        } else if (isTodayLog) {

          newMedicationLogs[logData.medicationId].takenToday = true;
          
          
          if (logDate > newMedicationLogs[logData.medicationId].lastTakenAt) {
            newMedicationLogs[logData.medicationId].lastTakenAt = logDate;
          }
        }
      });
      
      console.log("Medication logs:", newMedicationLogs);
      setMedicationLogs(newMedicationLogs);
    } catch (error) {
      console.error("Error fetching medication logs:", error);
    }
  };

  // Fetch medications from Firestore
  const fetchMedications = async () => {
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : null;
      if (!userId) {
        console.error("No user logged in");
        setLoading(false);
        return;
      }

      
      await fetchMedicationLogs();

      const medicationsCollection = collection(db, 'users', userId, 'medications');
      const medicationSnapshot = await getDocs(medicationsCollection);
      const medicationList = medicationSnapshot.docs.map(doc => {
        const data = doc.data();
        const timeInMinutes = timeToMinutes(data.time);
        return {
          id: doc.id,
          ...data,
          timeOfDay: getTimeOfDay(data.time),
          timeInMinutes: timeInMinutes
        };
      });
      
 
      medicationList.sort((a, b) => a.timeInMinutes - b.timeInMinutes);
      console.log("Processed medications:", medicationList); 
      
      setMedications(medicationList);
      setLoading(false);
      
      // Schedule notifications for all medications
      medicationList.forEach(med => {
        scheduleNotification(med);
      });
    } catch (error) {
      console.error("Error fetching medications: ", error);
      setLoading(false);
    }
  };


  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused, fetching medications..."); // Debug
      fetchMedications();
      return () => {

      };
    }, [])
  );

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

 
  const getNextMedication = () => {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    

    const currentTimeInMinutes = currentHour * 60 + currentMinutes;
    

    const medicationsWithTimeDiff = medications.map(med => {
      const medTimeInMinutes = timeToMinutes(med.time);
      
   
      let timeDifference = medTimeInMinutes - currentTimeInMinutes;
      if (timeDifference < 0) {
        timeDifference += 24 * 60; 
      }
      
      // Check if this medication has been taken today
      const isTaken = medicationLogs[med.id]?.takenToday || false;
      
      return {
        ...med,
        timeDifference,
        isTaken
      };
    });
   
    const nextUntakenMeds = medicationsWithTimeDiff
      .filter(med => !med.isTaken)
      .sort((a, b) => a.timeDifference - b.timeDifference);
    
    if (nextUntakenMeds.length > 0) {
      return {
        medication: nextUntakenMeds[0],
        timeOfDay: nextUntakenMeds[0].timeOfDay
      };
    }
    
    // If all are taken, show the next one in the schedule 
    const sortedMeds = [...medicationsWithTimeDiff].sort((a, b) => a.timeDifference - b.timeDifference);
    
    if (sortedMeds.length > 0) {
      return {
        medication: sortedMeds[0],
        timeOfDay: sortedMeds[0].timeOfDay
      };
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

  const handleUpNextMedicationPress = (medication) => {
   
    if (medicationLogs[medication.id]?.takenToday) {
      Alert.alert(
        "Already Taken",
        `You've already recorded ${medication.medicationName || medication.name} as taken today.`,
        [{ text: "OK" }]
      );
    } else {
      
      Alert.alert(
        "Medication Reminder",
        `Have you taken your ${medication.medicationName || medication.name}?`,
        [
          {
            text: "Not Yet",
            style: "cancel"
          },
          {
            text: "Yes, Taken",
            onPress: () => recordMedicationTaken(medication)
          }
        ]
      );
    }
  };

 
  const isMedicationTaken = (medicationId) => {
    return medicationLogs[medicationId]?.takenToday || false;
  };


  const renderMedicationCard = (medData) => {
    if (!medData) return null;
    
    const taken = isMedicationTaken(medData.medication.id);
    
    return (
      <View>
        <Text style={styles.nextMedicationPeriod}>{medData.timeOfDay}</Text>
        <TouchableOpacity 
          style={styles.medicationCard}
          onPress={() => handleUpNextMedicationPress(medData.medication)}
        >
          <View style={styles.medicationHeader}>
            <Text style={styles.medicationName}>{medData.medication.medicationName || medData.medication.name}</Text>
            <Text style={[
              styles.medicationStatus, 
              taken ? styles.takenStatus : styles.notTakenStatus
            ]}>
              {taken ? "Taken" : "Not Taken"}
            </Text>
            
          </View>
          
          <View style={styles.medicationDetailsContainer}>
            <View style={styles.medicationDetailItem}>
              <Text style={styles.medicationDetailLabel}>Time</Text>
              <Text style={styles.medicationDetailText}>{medData.medication.time}</Text>
            </View>
            <View style={styles.medicationDetailItem}>
              <Text style={styles.medicationDetailLabel}>Quantity</Text>
              <Text style={styles.medicationDetailText}>{medData.medication.dosage}</Text>
            </View>
            <View style={styles.medicationDetailItem}>
              <Text style={styles.medicationDetailLabel}>Instructions</Text>
              <Text style={styles.medicationDetailText}>{medData.medication.mealOption}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
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
          {activeTab === 'upNext' ? (
            <>
              <View style={styles.nextMedicationSection}>
               
                {(() => {
                  const nextMed = getNextMedication();
                  if (nextMed) {
                    return renderMedicationCard(nextMed);
                  } else {
                    return (
                      <View style={styles.noUpcomingContainer}>
                        <Text style={styles.noUpcomingText}>No upcoming medications scheduled</Text>
                      </View>
                    );
                  }
                })()}
              </View>
              
              <TouchableOpacity style={styles.addMoreButton} onPress={handleAdd}>
                <Text style={styles.buttonText}>Add More Medications</Text>
              </TouchableOpacity>

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
            </>
          ) : (
            <>
              {/* ALL TAB */}
              <View>
                {/* Display all medications grouped by time of day */}
                {timeOrder.map(timeOfDay => {
                  if (groupedMedications[timeOfDay] && groupedMedications[timeOfDay].length > 0) {
                    return (
                      <View key={timeOfDay} style={styles.timeSection}>
                        <Text style={styles.timeSectionTitle}>{timeOfDay}</Text>
                        {groupedMedications[timeOfDay].map(med => {
                          const taken = isMedicationTaken(med.id);
                          return (
                            <TouchableOpacity 
                              key={med.id} 
                              style={styles.medicationCard}
                              onPress={() => taken ? 
                                navigateToMedicationDetail(med.id) : 
                                handleUpNextMedicationPress(med)
                              }
                            >
                              <View style={styles.medicationHeader}>
                                <Text style={styles.medicationName}>{med.medicationName || med.name}</Text>
                                <Text style={[
                                  styles.medicationStatus, 
                                  taken ? styles.takenStatus : styles.notTakenStatus
                                ]}>
                                  {taken ? "Taken" : "Not Taken"}
                                </Text>
                             
                              </View>
                              
                              <View style={styles.medicationDetailsContainer}>
                                <View style={styles.medicationDetailItem}>
                                  <Text style={styles.medicationDetailLabel}>Time</Text>
                                  <Text style={styles.medicationDetailText}>{med.time}</Text>
                                </View>
                                <View style={styles.medicationDetailItem}>
                                  <Text style={styles.medicationDetailLabel}>Quantity</Text>
                                  <Text style={styles.medicationDetailText}>{med.dosage}</Text>
                                </View>
                                <View style={styles.medicationDetailItem}>
                                  <Text style={styles.medicationDetailLabel}>Instructions</Text>
                                  <Text style={styles.medicationDetailText}>{med.mealOption}</Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
              
              <TouchableOpacity style={styles.addMoreButton} onPress={handleAdd}>
                <Text style={styles.buttonText}>Add More Medications</Text>
              </TouchableOpacity>
              
             
            </>
          )}
        </>
      )}

     
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
    marginVertical: 10,
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
    marginRight: 10, 
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

export default HomeScreen;