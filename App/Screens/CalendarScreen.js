import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';

const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    // Automatically select today's date on load
    const today = new Date();
    const todayString = formatDateString(today);
    setSelectedDate(todayString);
    fetchMedicationLogs();
  }, []);

  // Format date as YYYY-MM-DD
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format date as Month Day, Year
  const formatReadableDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time as hh:mm AM/PM
  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Fetch medication logs from Firestore
  const fetchMedicationLogs = async () => {
    try {
      setLoading(true);
      const logsRef = collection(db, 'medicationLogs');
      const q = query(logsRef, orderBy('takenAt', 'desc'));
      const snapshot = await getDocs(q);

      const logs = [];
      const markedDatesObj = {};
      
      console.log(`Found ${snapshot.size} total logs in database`);

      snapshot.forEach((doc) => {
        const data = doc.data();
        let takenAt = data.takenAt;

        console.log(`Raw log data:`, JSON.stringify(data));
        console.log(`Raw takenAt:`, takenAt);

        // Parse Firestore timestamp correctly
        if (takenAt && takenAt.toDate) {
          takenAt = takenAt.toDate();
          console.log(`Converted timestamp to Date:`, takenAt);
        } else if (typeof takenAt === 'string') {
          takenAt = new Date(takenAt);
          console.log(`Converted string to Date:`, takenAt);
        }

        if (takenAt instanceof Date && !isNaN(takenAt)) {
          // Format date for calendar marking (YYYY-MM-DD)
          const dateString = formatDateString(takenAt);
          console.log(`Formatted dateString:`, dateString);

          // Add to logs array
          logs.push({
            id: doc.id,
            ...data,
            takenAt,
            dateString,
          });

          // Mark dates with green dots
          markedDatesObj[dateString] = {
            marked: true,
            dotColor: '#50cebb',
          };
        } else {
          console.log(`Invalid date found:`, takenAt);
        }
      });

      console.log(`Processed ${logs.length} valid logs`);
      console.log(`Marked dates:`, JSON.stringify(markedDatesObj));

      // Update the selected date in markedDates
      if (selectedDate) {
        markedDatesObj[selectedDate] = {
          ...(markedDatesObj[selectedDate] || {}),
          selected: true,
          selectedColor: '#50cebb',
        };
      }

      setMedicationLogs(logs);
      setMarkedDates(markedDatesObj);
      
      // Debug - show what's in the logs after setting state
      setTimeout(() => {
        console.log(`After state update - Selected date: ${selectedDate}`);
        console.log(`After state update - Total logs: ${logs.length}`);
        const filtered = logs.filter(log => log.dateString === selectedDate);
        console.log(`After state update - Filtered logs for selected date: ${filtered.length}`);
      }, 100);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medication logs:', error);
      Alert.alert('Error', 'Failed to load medication logs: ' + error.message);
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (day) => {
    const selectedDateString = day.dateString;
    console.log(`Date selected: ${selectedDateString}`);
    
    setSelectedDate(selectedDateString);

    // Highlight selected date
    const updatedMarkedDates = { ...markedDates };
    Object.keys(updatedMarkedDates).forEach((date) => {
      if (updatedMarkedDates[date].selected) {
        updatedMarkedDates[date] = {
          ...updatedMarkedDates[date],
          selected: false,
          selectedColor: undefined,
        };
      }
    });

    updatedMarkedDates[selectedDateString] = {
      ...(updatedMarkedDates[selectedDateString] || {}),
      selected: true,
      selectedColor: '#50cebb',
    };

    setMarkedDates(updatedMarkedDates);
    
    // Debug - check matching logs
    const filtered = medicationLogs.filter(log => log.dateString === selectedDateString);
    console.log(`Found ${filtered.length} logs for selected date ${selectedDateString}`);
    filtered.forEach(log => {
      console.log(`Matching log: ${log.id}, Date: ${log.dateString}, Medication: ${log.medicationName}`);
    });
  };

  // Filter logs based on selected date with improved logging
  const getFilteredMedicationLogs = () => {
    if (!selectedDate) {
      console.log('No selected date for filtering');
      return [];
    }
    
    const filtered = medicationLogs.filter(log => {
      const matches = log.dateString === selectedDate;
      if (matches) {
        console.log(`Log matches: ${log.id}, ${log.medicationName}`);
      }
      return matches;
    });
    
    console.log(`Filtered logs count: ${filtered.length} for date ${selectedDate}`);
    return filtered;
  };

  // Manual debug function that can be called from a button
  const debugLogs = () => {
    console.log('===== DEBUG LOGS =====');
    console.log(`Selected date: ${selectedDate}`);
    console.log(`Total medication logs: ${medicationLogs.length}`);
    
    // Check all logs
    medicationLogs.forEach(log => {
      console.log(`Log: ${log.id}, Date: ${log.dateString}, Medication: ${log.medicationName}`);
    });
    
    // Check filtered logs
    const filtered = getFilteredMedicationLogs();
    console.log(`Filtered logs: ${filtered.length}`);
    
    Alert.alert(
      'Debug Info', 
      `Selected date: ${selectedDate}\nTotal logs: ${medicationLogs.length}\nFiltered logs: ${filtered.length}`
    );
  };

  const filteredLogs = getFilteredMedicationLogs();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with MediLogs aligned to the far right */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={styles.headerTitle}>MediLogs</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#50cebb" />
        </View>
      ) : (
        <>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            theme={{
              todayTextColor: '#50cebb',
              selectedDayBackgroundColor: '#50cebb',
              dotColor: '#50cebb',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              arrowColor: '#50cebb',
            }}
          />

          <View style={styles.divider} />

          <View style={styles.logsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedDate
                  ? `Logs for ${formatReadableDate(selectedDate)}`
                  : 'Select a date to view logs'}
              </Text>
              
              {/* Debug button - remove in production */}
              <TouchableOpacity style={styles.debugButton} onPress={debugLogs}>
                <Ionicons name="bug-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <View key={log.id} style={styles.medicationCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.medicationName}>{log.medicationName}</Text>
                      <Text style={styles.dosage}>{log.dosage}</Text>
                    </View>
                    <View style={styles.timeContainer}>
                      <View style={styles.timeItem}>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={styles.timeLabel}>Scheduled: </Text>
                        <Text style={styles.timeValue}>{log.scheduled}</Text>
                      </View>
                      <View style={styles.timeItem}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#50cebb" />
                        <Text style={styles.timeLabel}>Taken at: </Text>
                        <Text style={styles.timeValue}>
                          {log.takenAt instanceof Date ? formatTime(log.takenAt) : 'Invalid time'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                selectedDate && (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No logs for this date</Text>
                    <Text style={styles.debugText}>
                      Total logs: {medicationLogs.length}, Selected date: {selectedDate}
                    </Text>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  logsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  debugButton: {
    padding: 5,
  },
  scrollView: {
    flex: 1,
  },
  medicationCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: '600',
  },
  dosage: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e8f4f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeContainer: {
    marginTop: 5,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default CalendarScreen;