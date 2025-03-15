import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();
  const currentDate = new Date();
  const formattedDate = `${currentDate.getDate()}${getDaySuffix(currentDate.getDate())} ${getMonthName(currentDate.getMonth())} ${currentDate.getFullYear()}`;

  function getDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  const navigateToProfile = () => {
    navigation.navigate('MedicalIDScreen');
    console.log('pressed Profile');
  };

  const handleAdd = () => {
    navigation.navigate('MedTrack');
    console.log('pressed Addmed');
  };

  const navigateToMediVision = () => {
    navigation.navigate('MediVision');
    console.log('pressed MediVision');
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

      {/* Today's Date Section */}
      <View style={styles.dateSection}>
        <Text style={styles.todayText}>Today</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>Up Next</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inactiveTab}>
          <Text style={styles.inactiveTabText}>All</Text>
        </TouchableOpacity>
      </View>

      {/* Set up Medication */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Set Up Medication</Text>
        <Text style={styles.cardDescription}>
          All your medications in one place, Set your schedule, check for interactions, and track what you take.
        </Text>
        <TouchableOpacity style={styles.blackButton} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add a Medication</Text>
        </TouchableOpacity>
      </View>

      {/* Track Your Medication */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Track Your Medication</Text>
        <Text style={styles.cardDescription}>
          Why it's Important to keep up with what you're taking
        </Text>
        <TouchableOpacity style={styles.readMoreButton}>
          <Text style={styles.readMoreText}>Read about it</Text>
        </TouchableOpacity>
      </View>

      {/* Medication Log Section */}
      <Text style={styles.sectionTitle}>Medication Log</Text>

      {/* Daily Logs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Logs</Text>
        <Text style={styles.cardDescription}>
          Log the medications you have taken to keep track of it
        </Text>
      </View>

      {/* MediVision Section */}
      <Text style={styles.sectionTitle}>MediVision</Text>
      <Text style={styles.sectionDescription}>
        Try out out MediVision where it gives information from the package of the medication
      </Text>
      
      <TouchableOpacity 
        style={styles.mediVisionButton} 
        onPress={navigateToMediVision}
      >
        <Text style={styles.buttonText}>MediVision</Text>
      </TouchableOpacity>

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
  dateSection: {
    marginVertical: 15,
  },
  todayText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    marginVertical: 20,
  },
  activeTab: {
    backgroundColor: 'black',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 10,
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  inactiveTab: {
    backgroundColor: '#e0e0e0',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  inactiveTabText: {
    color: 'black',
    fontWeight: 'bold',
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
    marginBottom: 20,
  },
  readMoreButton: {
    alignSelf: 'flex-end',
  },
  readMoreText: {
    color: 'blue',
    fontWeight: '500',
  },
  mediVisionButton: {
    backgroundColor: 'black',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  bottomPadding: {
    height: 30,
  },
});

export default HomeScreen;