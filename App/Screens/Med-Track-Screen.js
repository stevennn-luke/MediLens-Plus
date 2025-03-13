import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MedTrack = ({ navigation }) => {
  const [medications, setMedications] = useState([]);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        {/* MediLens+  text and Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>MediLens+</Text>
          <Text style={styles.subtitle}>Add your medications to keep a Log</Text>
        </View>
        
        {/* Setup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Up Medication</Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureText}>Track all your medications in one place</Text>
            <Text style={styles.featureText}>Set a Schedule and get reminders</Text>
            <Text style={styles.featureText}>Learn about the medication</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              // Navigate to add medication screen
              // navigation.navigate('AddMedication');
              console.log('Navigate to add medication screen');
            }}
          >
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>
        
        {/* Previously Added Section */}
        <Text style={styles.sectionHeader}>Previously Added</Text>
        
        {medications.length > 0 ? (
          <View style={styles.medicationsList}>
            {medications.map(med => (
              <View key={med.id} style={styles.medicationItem}>
                <Text style={styles.medicationName}>{med.name}</Text>
                <Text style={styles.medicationDetails}>
                  {med.dosage} • {med.frequency}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Information</Text>
            <Text style={styles.infoText}>
              Why it's Important to keep up with what you're taking
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {
            console.log('Navigate to all medications view');
          }}
        >
          <Text style={styles.viewAllText}>View all Medication</Text>
        </TouchableOpacity>
        
        {/* Medication Log Section */}
        <Text style={styles.sectionHeader}>Medication Log</Text>
        
        <View style={styles.logSection}>
          <Text style={styles.logTitle}>Daily Logs</Text>
          <Text style={styles.logText}>
            Log the medications you have taken to keep track of it
          </Text>
          
          <TouchableOpacity 
            style={[styles.addButton, { marginTop: 20 }]}
            onPress={() => {
        
              console.log('Navigate to medication log screen');
            }}
          >
            <Text style={styles.addButtonText}>Log Medication</Text>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  titleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    //paddingVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    
  },
  section: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    margin: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featureList: {
    marginBottom: 15,
  },
  featureText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 20,
   // marginTop: 5,
    marginBottom: 10,
  },
  infoSection: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    margin: 15,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  medicationsList: {
    margin: 20,
  },
  medicationItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
  },
  viewAllButton: {
    alignSelf: 'flex-end',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  viewAllText: {
    color: '#0066cc',
    fontSize: 16,
  },
  logSection: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 10,
  },
  logTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  logText: {
    fontSize: 16,
    color: '#333',
  },
});

export default MedTrack;