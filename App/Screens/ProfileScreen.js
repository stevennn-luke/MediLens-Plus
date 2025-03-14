import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../config/firebase'; 
import { doc, setDoc, getDoc } from 'firebase/firestore';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    bloodType: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setUserId(user.uid);
        fetchUserData(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (uid) => {
    try {
      console.log("🔄 Fetching user data from Firestore...");
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("✅ User data found:", docSnap.data());
        setFormData(docSnap.data());
      } else {
        console.log("⚠️ No profile data found.");
      }
    } catch (error) {
      console.error("❌ Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
  setFormData((prev) => ({
    ...prev,
    [key]: value,
  }));
};


  const handleSave = async () => {
    if (!userId) {
      console.log("❌ No user signed in!");
      return;
    }

    try {
      console.log("🔄 Saving profile data to Firestore...");
      await setDoc(doc(db, "users", userId), formData, { merge: true });
      console.log("✅ Profile data saved successfully:", formData);
      navigation.navigate('HomeScreen');
    } catch (error) {
      console.error("❌ Error saving profile data:", error);
    }
  };
  const handleDateChange = (event, selectedDate) => {
    // Keep the picker open and just update the date
    const currentDate = selectedDate || date;
    setDate(currentDate);
  };

  const confirmDate = () => {
    setShowDatePicker(false);
    const formattedDate = date.toLocaleDateString();
    handleChange('dateOfBirth', formattedDate);
  };

  const cancelDate = () => {
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.headerTitle}>Set Up Profile</Text>
          <Text style={styles.subtitle}>Input your personal details into MediLens+</Text>

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

            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)} 
              style={styles.datePickerButton}
            >
              <Text style={[styles.datePickerText, !formData.dateOfBirth && styles.placeholderText]}>
                {formData.dateOfBirth || "Date of Birth"}
              </Text>
            </TouchableOpacity>
            
            {/* iOS specific date picker implementation */}
            {Platform.OS === 'ios' && showDatePicker && (
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity onPress={cancelDate}>
                    <Text style={styles.iosPickerCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmDate}>
                    <Text style={styles.iosPickerConfirm}>Confirm</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  style={styles.iosPicker}
                />
              </View>
            )}
          

            <TextInput
              style={styles.input}
              placeholder="Blood Type"
              value={formData.bloodType}
              onChangeText={(text) => handleChange('bloodType', text)}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  placeholderText: {
    color: '#999',
  },
  saveButton: {
    backgroundColor: '#111',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // iOS specific picker styles
  iosPickerContainer: {
    backgroundColor: '#f9f9f9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9e9',
    backgroundColor: '#fff',
  },
  iosPickerCancel: {
    color: '#777',
    fontSize: 17,
  },
  iosPickerConfirm: {
    color: '#007AFF',
    fontSize: 17,
    fontWeight: '600',
  },
  iosPicker: {
    height: 216, // Standard iOS picker height
    backgroundColor: '#fff',
  },
});

export default ProfileScreen;
