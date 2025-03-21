
/*
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';

const CalendarScreen = () => {
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [medicationsForDay, setMedicationsForDay] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedicationLogs();
  }, []);

  const fetchMedicationLogs = async () => {
    try {
      setLoading(true);
      const medicationLogsRef = firestore().collection('medicationLogs');
      const snapshot = await medicationLogsRef.get();
      
      const marked = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.takenAt) {
          const date = moment(data.takenAt.toDate()).format('YYYY-MM-DD');
          
          marked[date] = {
            selected: true,
            marked: true,
            selectedColor: '#4CAF50',
            dotColor: '#4CAF50'
          };
        }
      });
      
      setMarkedDates(marked);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medication logs:', error);
      setLoading(false);
    }
  };

  const fetchMedicationsForDate = async (date) => {
    try {
      const startOfDay = moment(date).startOf('day').toDate();
      const endOfDay = moment(date).endOf('day').toDate();
      
      const medicationLogsRef = firestore().collection('medicationLogs');
      const snapshot = await medicationLogsRef
        .where('takenAt', '>=', startOfDay)
        .where('takenAt', '<=', endOfDay)
        .get();
      
      const medications = [];
      
      snapshot.forEach(doc => {
        medications.push({
          id: doc.id,
          ...doc.data(),
          takenAt: doc.data().takenAt ? moment(doc.data().takenAt.toDate()).format('h:mm A') : 'N/A',
          scheduled: doc.data().scheduled ? moment(doc.data().scheduled.toDate()).format('h:mm A') : 'N/A'
        });
      });
      
      setMedicationsForDay(medications);
      setSelectedDate(date);
      setModalVisible(true);
    } catch (error) {
      console.error('Error fetching medications for date:', error);
    }
  };

  const onDayPress = (day) => {
    fetchMedicationsForDate(day.dateString);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Medication Calendar</Text>
      
      <Calendar
        markedDates={markedDates}
        onDayPress={onDayPress}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#4CAF50',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4CAF50',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#4CAF50',
          selectedDotColor: '#ffffff',
          arrowColor: '#4CAF50',
          monthTextColor: '#2d4150',
          indicatorColor: '#4CAF50',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14
        }}
      />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading medication data...</Text>
        </View>
      )}
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>{selectedDate ? moment(selectedDate).format('MMMM D, YYYY') : ''}</Text>
            
            {medicationsForDay.length > 0 ? (
              <ScrollView style={styles.medicationList}>
                {medicationsForDay.map(medication => (
                  <View key={medication.id} style={styles.medicationItem}>
                    <Text style={styles.medicationName}>{medication.medicationName}</Text>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.detailLabel}>Dosage:</Text>
                      <Text style={styles.detailValue}>{medication.dosage}</Text>
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.detailLabel}>Scheduled:</Text>
                      <Text style={styles.detailValue}>{medication.scheduled}</Text>
                    </View>
                    <View style={styles.medicationDetails}>
                      <Text style={styles.detailLabel}>Taken at:</Text>
                      <Text style={styles.detailValue}>{medication.takenAt}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noMedicationsText}>No medications taken on this day</Text>
            )}
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 16,
    color: '#333',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    fontWeight: 'bold',
    fontSize: 20,
    color: '#333',
  },
  medicationList: {
    width: '100%',
    maxHeight: 400,
  },
  medicationItem: {
    backgroundColor: '#f0f7f0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  medicationDetails: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  noMedicationsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 10,
    paddingHorizontal: 20,
    elevation: 2,
    marginTop: 15,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CalendarScreen;

*/