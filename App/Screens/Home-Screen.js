import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';


const HomeScreen = () => {

  const navigation = useNavigation();

  const navigateToProfile = () => {
    navigation.navigate('MedicalIDScreen');
    console.log('pressed Profile');
  };


  const handleAdd = () => {
    navigation.navigate('MedTrack');
    console.log('pressed Addmed');
  };

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>MediLens+</Text>
        <TouchableOpacity 
          style={styles.profileButton} 
         onPress={navigateToProfile}
        >
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>P</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.welcomeText}>Welcome to MediLens+</Text>

          {/* Daily Log Count */}
          <Text style={styles.sectionTitle}>Daily log Count</Text>
      <Text style={styles.sectionDescription}>Shows the number of days you logged a medication</Text>
      <Text style={styles.countNumber}>01</Text>

      {/* Set up Medication */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Set Up Medication</Text>
        <Text style={styles.cardDescription}>
          All your medications in one place, Set your schedule, check for interactions, and track what you take.
        </Text>
        <TouchableOpacity style={styles.blackButton} 
        onPress={handleAdd} 
        >
          <Text style={styles.buttonText}>Add a Medication</Text>
        </TouchableOpacity>
      </View>


      {/* About Medication Tracking */}
      <Text style={styles.sectionTitle}>About Medication Tracking</Text>
      
      {/* About Medication Tracking */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Track Your Medication</Text>
        <Text style={styles.cardDescription}>
          Why it's Important to keep up with what you're taking
        </Text>
        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read about it</Text>
        </TouchableOpacity>
      </View>

      {/* Reminders Section */}
      <Text style={styles.sectionTitle}>Reminders</Text>
      <Text style={styles.sectionDescription}>Don't worry we'll send in a notification to remind you</Text>
      
      {/* Reminder Boxes - Empty placeholders */}
      <View style={styles.reminderContainer}>
        <View style={styles.reminderBox}></View>
        <View style={styles.reminderBox}></View>
        <View style={styles.reminderBox}></View>
        <View style={styles.reminderBox}></View>
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
    paddingTop: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 25,
    
  },
  card: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 15,
    marginBottom: 15,
    lineHeight: 22,
  },
  blackButton: {
    backgroundColor: 'black',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  countNumber: {
    fontSize: 60,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  readMoreButton: {
    alignSelf: 'flex-end',
  },
  readMoreText: {
    color: 'blue',
    fontWeight: '500',
  },
  reminderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  reminderBox: {
    width: '48%',
    height: 80,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginBottom: 10,
  },
  bottomPadding: {
    height: 30,
  },
});

export default HomeScreen;