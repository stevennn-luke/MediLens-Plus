import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const ActualProfile = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  
  const [userName, setUserName] = useState('User');
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.firstName || 'User');
          setProfileImage(userData.profileImage || null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => pickImage('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const pickImage = async (source) => {
    try {
      let result;
      
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Camera permission is required');
          return;
        }
        
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Gallery permission is required');
          return;
        }
        
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      const fileRef = ref(storage, `profileImages/${user.uid}`);
      await uploadBytes(fileRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(fileRef);
      
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: downloadURL
      });
      
      setProfileImage(downloadURL);
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.navigate('WelcomeScreen');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const navigateToMedicalID = () => {
    navigation.navigate('MedicalIDScreen');
  };

  const renderSettingItem = (title, onPress) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
    >
      <Text style={styles.settingText}>{title}</Text>
      <Ionicons name="chevron-forward" size={24} color="#777" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
       <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>MediLens+</Text>
        </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePicker} style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={50} color="#999" />
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.userName}>{userName.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        {renderSettingItem('Health Details', () => {})}
        {renderSettingItem('Medical ID', navigateToMedicalID)}
      </View>

      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.section}>
        {renderSettingItem('Health Checklist', () => {})}
        {renderSettingItem('Health Records', () => {})}
        {renderSettingItem('Notifications', () => {})}
        {renderSettingItem('Organ Donation', () => {})}
      </View>

      <Text style={styles.sectionTitle}> </Text>
      <View style={styles.section}>
        {renderSettingItem('Log Out', handleLogout)}
      </View>
    </ScrollView>
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
    paddingTop: 50,
    
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
    paddingTop: 20,
  },

  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 15,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E1E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginHorizontal: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },
  settingText: {
    fontSize: 16,
  },
});

export default ActualProfile;