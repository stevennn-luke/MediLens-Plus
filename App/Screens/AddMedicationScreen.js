import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../../config/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AddMedicationScreen = ({ navigation, route }) => {
  const { userId } = route.params || { userId: auth.currentUser?.uid };
  const [medicationName, setMedicationName] = useState('Allegra 120mg Tablet');
  const [selectedTime, setSelectedTime] = useState('9:00 AM');
  const [selectedDosage, setSelectedDosage] = useState('1 Tablet');
  const [selectedMealOption, setSelectedMealOption] = useState('With Meal');
  const [pushNotificationEnabled, setPushNotificationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [medicationImage, setMedicationImage] = useState(null);
  

  const [periodicity, setPeriodicity] = useState('Daily');
  const [duration, setDuration] = useState('30 days');
  const [stock, setStock] = useState('30 tablets');
  const [notify, setNotify] = useState('15 minutes before');
  const [snooze, setSnooze] = useState('5 minutes');

  const mealOptions = ['Before Meal', 'With Meal', 'After Meal'];
  const dosageOptions = ['1/2 Tablet', '1 Tablet', '2 Tablets', '3 Tablets'];
  const timeOptions = ['8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '6:00 PM', '9:00 PM'];
  const periodicityOptions = ['Daily', 'Twice Daily', 'Every Other Day', 'Weekly', 'As Needed'];
  const durationOptions = ['7 days', '14 days', '30 days', '60 days', '90 days', 'Indefinite'];
  const stockOptions = ['10 tablets', '20 tablets', '30 tablets', '60 tablets', '90 tablets'];
  const notifyOptions = ['5 minutes before', '15 minutes before', '30 minutes before', '1 hour before'];
  const snoozeOptions = ['5 minutes', '10 minutes', '15 minutes', '30 minutes'];

  const pickImage = async () => {
    // Permission to access gallery
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to select an image.');
      return;
    }

    // Open image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMedicationImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // Permission to access camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your camera to take a photo.');
      return;
    }

    // Open camera
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMedicationImage(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    Alert.alert(
      'Change Medication Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: pickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const saveMedicationToFirestore = async () => {
    try {
      // Check if user is signed in
      if (!userId) {
        Alert.alert('Error', 'You need to be signed in to save medications');
        return;
      }

      // Upload image to Firebase Storage 
      let imageUrl = null;
      if (medicationImage) {
        const imageResponse = await fetch(medicationImage);
        const blob = await imageResponse.blob();
        const storage = auth.app.storage();
        const imageRef = ref(storage, `medications/${userId}/${new Date().getTime()}`);
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Save medication data to Firestore
      const medicationsCollectionRef = collection(db, 'users', userId, 'medications');
      
      await addDoc(medicationsCollectionRef, {
        medicationName,
        time: selectedTime,
        dosage: selectedDosage,
        mealOption: selectedMealOption,
        periodicity,
        duration,
        stock,
        pushNotificationEnabled,
        notify,
        snooze,
        imageUrl,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Success', 'Medication added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving medication: ', error);
      Alert.alert('Error', 'Failed to save medication. Please try again.');
    }
  };

  const renderSelectionModal = () => {
    if (!activeTab) return null;

    let options = [];
    let selectedValue = '';
    let setFunction = null;

    switch (activeTab) {
      case 'time':
        options = timeOptions;
        selectedValue = selectedTime;
        setFunction = setSelectedTime;
        break;
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
        <ScrollView style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionItem,
                selectedValue === option && styles.selectedOption,
              ]}
              onPress={() => {
                setFunction(option);
                setActiveTab(null);
              }}
            >
              <Text style={[
                styles.optionText,
                selectedValue === option && styles.selectedOptionText,
              ]}>
                {option}
              </Text>
              {selectedValue === option && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
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
        <View style={styles.medicationContainer}>
          <TouchableOpacity 
            style={styles.medicationImageContainer}
            onPress={handleImagePress}
          >
            <View style={styles.medicationImagePlaceholder}>
              {medicationImage ? (
                <Image 
                  source={{ uri: medicationImage }} 
                  style={styles.medicationImage}
                />
              ) : (
                <Text style={styles.pillText}>Rx</Text>
              )}
            </View>
            <View style={styles.changeImageButton}>
              <Text style={styles.changeImageText}>Change</Text>
            </View>
          </TouchableOpacity>
          
          <TextInput
            style={styles.medicationNameInput}
            value={medicationName}
            onChangeText={setMedicationName}
            placeholder="Enter medication name"
          />
        </View>

        <View style={styles.quickInfoRow}>
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setActiveTab('time')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>⏰</Text>
            </View>
            <Text style={styles.infoLabel}>{selectedTime}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setActiveTab('dosage')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>💊</Text>
            </View>
            <Text style={styles.infoLabel}>{selectedDosage}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.infoItem}
            onPress={() => setActiveTab('meal')}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>🍽️</Text>
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
            <Text style={styles.settingValue}>{periodicity}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('duration')}
          >
            <Text style={styles.settingLabel}>Duration</Text>
            <Text style={styles.settingValue}>{duration}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('stock')}
          >
            <Text style={styles.settingLabel}>Stock</Text>
            <Text style={styles.settingValue}>{stock}</Text>
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
            <Text style={styles.settingValue}>{notify}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setActiveTab('snooze')}
          >
            <Text style={styles.settingLabel}>Snooze</Text>
            <Text style={styles.settingValue}>{snooze}</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Add notes"
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity 
          style={styles.addPlanButton}
          onPress={saveMedicationToFirestore}
        >
          <Text style={styles.addPlanButtonText}>Add Med</Text>
        </TouchableOpacity>
      </ScrollView>

      {renderSelectionModal()}
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
  medicationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  medicationImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  medicationImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  medicationImage: {
    width: '100%',
    height: '100%',
  },
  pillText: {
    fontSize: 32,
    color: '#888',
  },
  changeImageButton: {
    position: 'absolute',
    right: -8,
    top: -8,
    backgroundColor: '#3f8ae0', 
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
  },
  medicationNameInput: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  iconText: {
    fontSize: 20,
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
  settingValue: {
    fontSize: 16,
    color: '#888',
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
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  optionsContainer: {
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff', 
  },
  optionText: {
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#3f8ae0', 
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#3f8ae0', 
    fontSize: 18,
  },
});

export default AddMedicationScreen;