import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {

  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    bloodType: ''
  });

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    
    // Format the date as a string (e.g., "MM/DD/YYYY")
    const formattedDate = currentDate.toLocaleDateString();
    
    handleChange('dateOfBirth', formattedDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleSave = () => { 
    navigation.navigate('HomeScreen');
    console.log('Saving profile data:', formData);
  };

  return (
    /*
    <KeyboardAvoidingView 
    style={styles.container}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
  >
  */
    <SafeAreaView style={styles.container}>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
        <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>
        <Text style={styles.headerTitle}>Profile</Text>

        <Text style={styles.subtitle}>
          Input your personal details into MediLens+
        </Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
          />
          
          <TouchableOpacity onPress={showDatepicker} style={styles.datePickerButton}>
            <Text style={[styles.datePickerText, !formData.dateOfBirth && styles.placeholderText]}>
              {formData.dateOfBirth || "Date of Birth"}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Blood Type"
            value={formData.bloodType}
            onChangeText={(text) => handleChange('bloodType', text)}
          />
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>SAVE</Text>
        </TouchableOpacity>
        
        </View>
        </ScrollView>
    </SafeAreaView>
   // </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  backButton: {
    Position: 'absolute',
    top: 30,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
  },
  formContainer: {
    marginBottom: 40,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#111',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;