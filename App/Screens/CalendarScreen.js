import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../config/firebase';

const CalendarScreen = ({ navigation }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [medicationLogs, setMedicationLogs] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const fetchMedicationLogs = async () => {
    try {
      setLoading(true);
      const logsRef = db.collection('medicationLogs');
      const snapshot = await logsRef.get();
      
      const logs = [];
      const markedDatesObj = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Convert Firestore timestamp to Date object
        const takenAt = data.takenAt?.toDate ? data.takenAt.toDate() : new Date(data.takenAt);
        
        // Format date for calendar marking (YYYY-MM-DD)
        const dateString = formatDateString(takenAt);
        
        // Add to logs array
        logs.push({
          id: doc.id,
          ...data,
          takenAt,
          dateString
        });
        
        // Mark dates in calendar
        markedDatesObj[dateString] = {
          marked: true,
          dotColor: '#50cebb',
          selected: selectedDate === dateString
        };
      });
      
      setMedicationLogs(logs);
      setMarkedDates(markedDatesObj);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medication logs:', error);
      setLoading(false);
    }
  };

  const handleDateSelect = (day) => {
    const selectedDateString = day.dateString;
    
    // Update selected date
    setSelectedDate(selectedDateString);
    
    // Update marked dates to highlight selected date
    const updatedMarkedDates = { ...markedDates };
    
    // Reset previous selection
    Object.keys(updatedMarkedDates).forEach(date => {
      if (updatedMarkedDates[date].selected) {
        updatedMarkedDates[date] = {
          ...updatedMarkedDates[date],
          selected: false
        };
      }
    });
    
    // Update new selection
    updatedMarkedDates[selectedDateString] = {
      ...(updatedMarkedDates[selectedDateString] || {}),
      marked: true,
      dotColor: '#50cebb',
      selected: true,
      selectedColor: '#50cebb'
    };
    
    setMarkedDates(updatedMarkedDates);
  };

  const getFilteredMedicationLogs = () => {
    if (!selectedDate) return [];
    return medicationLogs.filter(log => log.dateString === selectedDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MediVision</Text>
        <View style={{ width: 24 }} />
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
            <Text style={styles.sectionTitle}>
              {selectedDate ? 
                `Medications for ${formatReadableDate(selectedDate)}` : 
                'Select a date to view medications'}
            </Text>
            
            <ScrollView style={styles.scrollView}>
              {getFilteredMedicationLogs().length > 0 ? (
                getFilteredMedicationLogs().map((log) => (
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
                          {log.takenAt instanceof Date ? formatTime(log.takenAt) : log.takenAt}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                selectedDate && (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No medications taken on this date</Text>
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
    justifyContent: 'space-between',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
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
  }
});

export default CalendarScreen;