import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { auth, db } from '../../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const AddMedicationScreen = ({ navigation, route }) => {
  const { userId } = route.params || { userId: auth.currentUser?.uid };
  const [medicationName, setMedicationName] = useState('');
  const [selectedHour, setSelectedHour] = useState('9');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState('AM');
  const [selectedDosage, setSelectedDosage] = useState('1 Tablet');
  const [selectedMealOption, setSelectedMealOption] = useState('With Meal');
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  
  const [periodicity, setPeriodicity] = useState('Daily');
  const [duration, setDuration] = useState('30 days');
  const [stock, setStock] = useState('30 tablets');
  const [notify, setNotify] = useState('15 minutes before');
  const [snooze, setSnooze] = useState('5 minutes');
  const [notes, setNotes] = useState('');

  // Options for pickers
  const mealOptions = ['Before Meal', 'With Meal', 'After Meal'];
  const dosageOptions = ['1/2 Tablet', '1 Tablet', '2 Tablets', '3 Tablets'];
  const periodicityOptions = ['Daily', 'Twice Daily', 'Every Other Day', 'Weekly', 'As Needed'];
  const durationOptions = ['7 days', '14 days', '30 days', '60 days', '90 days', 'Indefinite'];
  const stockOptions = ['10 tablets', '20 tablets', '30 tablets', '60 tablets', '90 tablets'];
  const notifyOptions = ['5 minutes before', '15 minutes before', '30 minutes before', '1 hour before'];
  const snoozeOptions = ['5 minutes', '10 minutes', '15 minutes', '30 minutes'];
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const amPmOptions = ['AM', 'PM'];

  const getSelectedTime = () => {
    return `${selectedHour}:${selectedMinute} ${selectedAmPm}`;
  };

  const saveMedicationToFirestore = async () => {
    try {
      if (!userId) {
        Alert.alert('Error', 'You need to be signed in to save medications');
        return;
      }

      if (!medicationName.trim()) {
        Alert.alert('Error', 'Please enter a medication name');
        return;
      }

      // Save medication data to Firestore
      const medicationsCollectionRef = collection(db, 'users', userId, 'medications');
      
      await addDoc(medicationsCollectionRef, {
        medicationName,
        time: getSelectedTime(),
        dosage: selectedDosage,
        mealOption: selectedMealOption,
        periodicity,
        duration,
        stock,
        pushNotificationEnabled,
        notify,
        snooze,
        notes,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Medication added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving medication: ', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    }
  };

  const renderIOSPicker = () => {
    if (!activeTab) return null;

    let options = [];
    let selectedValue = '';
    let setFunction = null;

    switch (activeTab) {
      case 'time':
        return (
          <View style={styles.selectionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <TouchableOpacity onPress={() => setActiveTab(null)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerContainer}>
              <View style={styles.pickerColumn}>
                
                <Picker
                  style={styles.picker}
                  selectedValue={selectedHour}
                  onValueChange={(itemValue) => setSelectedHour(itemValue)}
                >
                  {hours.map((hour) => (
                    <Picker.Item key={hour} label={hour} value={hour} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumn}>
                
                <Picker
                  style={styles.picker}
                  selectedValue={selectedMinute}
                  onValueChange={(itemValue) => setSelectedMinute(itemValue)}
                >
                  {minutes.map((minute) => (
                    <Picker.Item key={minute} label={minute} value={minute} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerColumn}>
                
                <Picker
                  style={styles.picker}
                  selectedValue={selectedAmPm}
                  onValueChange={(itemValue) => setSelectedAmPm(itemValue)}
                >
                  {amPmOptions.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setActiveTab(null)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        );
      case 'dosage':
        options = dosageOptions;
        selectedValue = selectedDosage;
        setFunction = setSelectedDosage;
        break;
      case 'meal':
        options = mealOptions;
        selectedValue = selectedMealOption;
        setFunction = setSelectedMealOption;
        break;
      case 'periodicity':
        options = periodicityOptions;
        selectedValue = periodicity;
        setFunction = setPeriodicity;
        break;
      case 'duration':
        options = durationOptions;
        selectedValue = duration;
        setFunction = setDuration;
        break;
      case 'stock':
        options = stockOptions;
        selectedValue = stock;
        setFunction = setStock;
        break;
      case 'notify':
        options = notifyOptions;
        selectedValue = notify;
        setFunction = setNotify;
        break;
      case 'snooze':
        options = snoozeOptions;
        selectedValue = snooze;
        setFunction = setSnooze;
        break;
      default:
        break;
    }

    return (
      <View style={styles.selectionModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{`Select ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}</Text>
          <TouchableOpacity onPress={() => setActiveTab(null)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.singlePickerContainer}>
          <Picker
            style={styles.fullWidthPicker}
            selectedValue={selectedValue}
            onValueChange={(itemValue) => {
              setFunction(itemValue);
            }}
          >
            {options.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => setActiveTab(null)}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
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
        <Text style={styles.headerTitle}>MediLens+</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TextInput
          style={styles.medicationNameInput}
          value={medicationName}
          onChangeText={setMedicationName}
          placeholder="Enter medication name"
        />

        <View style={styles.quickInfoRow}>
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setActiveTab('time')}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={24} color="#000" />
            </View>
            <Text style={styles.infoLabel}>{getSelectedTime()}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setActiveTab('dosage')}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons name="medication" size={24} color="#00" />
            </View>
            <Text style={styles.infoLabel}>{selectedDosage}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setActiveTab('meal')}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 name="utensils" size={20} color="#000" />
            </View>
            <Text style={styles.infoLabel}>{selectedMealOption}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity 
            style={styles.settingRow} 
            onPress={() => setActiveTab('periodicity')}
          >
            <Text style={styles.settingLabel}>Periodicity</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{periodicity}</Text>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('duration')}
          >
            <Text style={styles.settingLabel}>Duration</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{duration}</Text>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('stock')}
          >
            <Text style={styles.settingLabel}>Stock</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{stock}</Text>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </View>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notification</Text>
            <Switch
              trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
              thumbColor={pushNotificationEnabled ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#e0e0e0"
              onValueChange={() => setPushNotificationEnabled(!pushNotificationEnabled)}
              value={pushNotificationEnabled}
            />
          </View>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('notify')}
          >
            <Text style={styles.settingLabel}>Notify</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{notify}</Text>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('snooze')}
          >
            <Text style={styles.settingLabel}>Snooze</Text>
            <View style={styles.settingValueContainer}>
              <Text style={styles.settingValue}>{snooze}</Text>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </View>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Add notes"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity 
          style={styles.addPlanButton}
          onPress={saveMedicationToFirestore}
        >
          <Text style={styles.addPlanButtonText}>Add Med</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderIOSPicker()}
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
  scrollContent: {
    padding: 16,
  },
  medicationNameInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 20,
    width: '100%',
  },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  iconContainer: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
  },
  settingsContainer: {
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: '#888',
    marginRight: 5,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    height: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  addPlanButton: {
    backgroundColor: '#000000', 
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  addPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 26,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 20,
    color: '#888',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#888',
    marginVertical: 10,
  },
  picker: {
    width: '80%',
    height: 180,
  },
  singlePickerContainer: {
    paddingHorizontal: 16,
  },
  fullWidthPicker: {
    width: '100%',
    height: 180,
  },
  doneButton: {
    backgroundColor: '#000',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  doneButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddMedicationScreen;