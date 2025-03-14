import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WelcomeScreenMain = () => {
  const navigation = useNavigation();
  
  const handleGetStarted = () => {
    navigation.navigate('SignInPage');
    console.log('Get Started pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>MediLens+</Text>
        <Text style={styles.subtitle}>Keep Track of your{'\n'}Medication</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={handleGetStarted}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 45,
    marginTop: '90%',
    marginBottom: 20,
    fontWeight: 'bold'
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    lineHeight: 20,
  },
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#000',
    borderRadius: 40,
    paddingVertical: 18,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '69%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    color: '#FFF',
    marginRight: 30,
  },
  arrowIcon: {
    color: '#FFF',
    fontSize: 32,
  },
});

export default WelcomeScreenMain;