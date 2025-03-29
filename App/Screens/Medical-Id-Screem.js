import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const MedicalIDScreen = () => {
  const [userMedicalData, setUserMedicalData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    bloodType: '',
    weight: '',
    height: ''
  });
  
  const [originalData, setOriginalData] = useState({});
  const [editableFields, setEditableFields] = useState({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [showWeightPicker, setShowWeightPicker] = useState(false);
  const [showHeightPicker, setShowHeightPicker] = useState(false);
  const [showBloodTypePicker, setShowBloodTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState(new Date());
  
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  // Generate weight options (30kg - 200kg)
  const weightOptions = Array.from({ length: 171 }, (_, i) => `${i + 30} kg`);
  
  // Generate height options (100cm - 220cm)
  const heightOptions = Array.from({ length: 121 }, (_, i) => `${i + 100} cm`);

  // Blood type options
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const fetchMedicalData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserMedicalData(data);
          setOriginalData({...data});
          
          // Initialize dateValue if dateOfBirth exists
          if (data.dateOfBirth) {
            try {
              const [month, day, year] = data.dateOfBirth.split('/');
              setDateValue(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
            } catch (e) {
              setDateValue(new Date());
            }
          }
        }
      }
    };
    fetchMedicalData();
  }, []);

  useEffect(() => {
    // Check if data has changed to show save button
    const hasChanges = JSON.stringify(userMedicalData) !== JSON.stringify(originalData);
    setShowSaveButton(hasChanges);
  }, [userMedicalData, originalData]);

  const toggleFieldEditable = (field) => {
    if (field === 'weight') {
      setShowWeightPicker(true);
      return;
    }
    
    if (field === 'height') {
      setShowHeightPicker(true);
      return;
    }
    
    if (field === 'bloodType') {
      setShowBloodTypePicker(true);
      return;
    }
    
    if (field === 'dateOfBirth') {
      setShowDatePicker(true);
      return;
    }
    
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  const handleChange = (field, value) => {
    setUserMedicalData({
      ...userMedicalData,
      [field]: value
    });
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateValue;
    setShowDatePicker(Platform.OS === 'ios');
    setDateValue(currentDate);
    
    // Format date as MM/DD/YYYY
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    
    handleChange('dateOfBirth', formattedDate);
  };

  const saveChanges = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, userMedicalData);
        setOriginalData({...userMedicalData});
        setEditableFields({});
        setShowSaveButton(false);
      }
    } catch (error) {
      console.error("Error updating document: ", error);
      Alert.alert("Error", "Failed to save changes: " + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with back button and title */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical ID</Text>
        </View>
        
        <Text style={styles.subtitle}>Personal Information</Text>
        
        <View style={styles.formContainer}>
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => toggleFieldEditable('firstName')}
          >
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={userMedicalData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              editable={editableFields.firstName}
              placeholder="First Name"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => toggleFieldEditable('lastName')}
          >
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={userMedicalData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              editable={editableFields.lastName}
              placeholder="Last Name"
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => toggleFieldEditable('dateOfBirth')}
          >
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.input}>
              <Text>{userMedicalData.dateOfBirth || "Select Date of Birth"}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => toggleFieldEditable('bloodType')}
          >
            <Text style={styles.inputLabel}>Blood Type</Text>
            <View style={styles.input}>
              <Text>{userMedicalData.bloodType || "Select Blood Type"}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => toggleFieldEditable('weight')}
          >
            <Text style={styles.inputLabel}>Weight</Text>
            <View style={styles.input}>
              <Text>{userMedicalData.weight || "Select Weight"}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputContainer}
            onPress={() => toggleFieldEditable('height')}
          >
            <Text style={styles.inputLabel}>Height</Text>
            <View style={styles.input}>
              <Text>{userMedicalData.height || "Select Height"}</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {showSaveButton && (
          <TouchableOpacity style={[styles.saveButton, {marginTop: 20}]} onPress={saveChanges}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalTitle}>Select Date of Birth</Text>
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  style={styles.datePicker}
                  maximumDate={new Date()}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Weight Picker Modal - Using iOS-style wheel picker */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showWeightPicker}
          onRequestClose={() => setShowWeightPicker(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Weight</Text>
              {Platform.OS === 'ios' ? (
                <Picker
                  selectedValue={userMedicalData.weight || weightOptions[40]} // Default to 70kg
                  onValueChange={(itemValue) => handleChange('weight', itemValue)}
                  style={styles.iosPicker}
                  itemStyle={styles.iosPickerItem}
                >
                  {weightOptions.map((weight, index) => (
                    <Picker.Item key={index} label={weight} value={weight} />
                  ))}
                </Picker>
              ) : (
                <ScrollView style={styles.pickerScrollView}>
                  {weightOptions.map((weight, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.pickerItem}
                      onPress={() => {
                        handleChange('weight', weight);
                        setShowWeightPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        userMedicalData.weight === weight && styles.selectedPickerItem
                      ]}>
                        {weight}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowWeightPicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowWeightPicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Height Picker Modal - Using iOS-style wheel picker */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showHeightPicker}
          onRequestClose={() => setShowHeightPicker(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Height</Text>
              {Platform.OS === 'ios' ? (
                <Picker
                  selectedValue={userMedicalData.height || heightOptions[70]} // Default to 170cm
                  onValueChange={(itemValue) => handleChange('height', itemValue)}
                  style={styles.iosPicker}
                  itemStyle={styles.iosPickerItem}
                >
                  {heightOptions.map((height, index) => (
                    <Picker.Item key={index} label={height} value={height} />
                  ))}
                </Picker>
              ) : (
                <ScrollView style={styles.pickerScrollView}>
                  {heightOptions.map((height, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.pickerItem}
                      onPress={() => {
                        handleChange('height', height);
                        setShowHeightPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        userMedicalData.height === height && styles.selectedPickerItem
                      ]}>
                        {height}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowHeightPicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowHeightPicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Blood Type Picker Modal - Using iOS-style wheel picker for iOS */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showBloodTypePicker}
          onRequestClose={() => setShowBloodTypePicker(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Select Blood Type</Text>
              {Platform.OS === 'ios' ? (
                <Picker
                  selectedValue={userMedicalData.bloodType || bloodTypes[0]}
                  onValueChange={(itemValue) => handleChange('bloodType', itemValue)}
                  style={styles.iosPicker}
                  itemStyle={styles.iosPickerItem}
                >
                  {bloodTypes.map((type, index) => (
                    <Picker.Item key={index} label={type} value={type} />
                  ))}
                </Picker>
              ) : (
                <View style={styles.bloodTypeContainer}>
                  {bloodTypes.map((type, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.bloodTypeItem,
                        userMedicalData.bloodType === type && styles.selectedBloodType
                      ]}
                      onPress={() => {
                        handleChange('bloodType', type);
                        setShowBloodTypePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.bloodTypeText,
                        userMedicalData.bloodType === type && styles.selectedBloodTypeText
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowBloodTypePicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowBloodTypePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'space-between', // This will push the title to the right
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10, // Add some right margin
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
  },
  formContainer: {
    marginBottom: 20, // Reduced to accommodate the save button
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#000000', // Changed to black
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  datePicker: {
    height: 200,
    width: '100%',
  },
  pickerScrollView: {
    maxHeight: 200,
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedPickerItem: {
    color: '#000000', // Changed to black
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cancelButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    flex: 1,
    marginRight: 5,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#333',
  },
  doneButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#000000', // Changed to black
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bloodTypeItem: {
    padding: 15,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '20%',
    alignItems: 'center',
  },
  selectedBloodType: {
    backgroundColor: '#000000', // Changed to black
    borderColor: '#000000', // Changed to black
  },
  bloodTypeText: {
    fontSize: 14,
  },
  selectedBloodTypeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // New styles for iOS picker
  iosPicker: {
    width: '100%',
    height: 200,
  },
  iosPickerItem: {
    fontSize: 16,
    height: 110,
  },
});

export default MedicalIDScreen;