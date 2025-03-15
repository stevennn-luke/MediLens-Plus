import React, { useEffect, useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const MedicalIDScreen = () => {
  const [userMedicalData, setUserMedicalData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    bloodType: '',
    weight: '',
    height: ''
  });

  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const fetchMedicalData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserMedicalData(userDocSnap.data());
        }
      }
    };
    
    fetchMedicalData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.title}>Medical ID</Text>
        <Text style={styles.subtitle}>Personal Information</Text>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={userMedicalData.firstName}
            editable={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={userMedicalData.lastName}
            editable={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Date of Birth"
            value={userMedicalData.dateOfBirth}
            editable={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Blood Type"
            value={userMedicalData.bloodType}
            editable={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Weight"
            value={userMedicalData.weight}
            editable={false}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Height"
            value={userMedicalData.height}
            editable={false}
          />
        </View>
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
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    paddingVertical: 20,
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
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9', 
  },
});

export default MedicalIDScreen;