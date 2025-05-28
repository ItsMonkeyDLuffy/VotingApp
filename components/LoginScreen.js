import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid', 'Phone number must be 10 digits');
      return;
    }

    const formattedPhone = `+91${phone}`;
    setIsLoading(true);

    try {
      const userData = await AsyncStorage.getItem(formattedPhone);

      if (userData) {
        const { name } = JSON.parse(userData);
        navigation.navigate('WelcomeBack', { phone: formattedPhone, name });
      } else {
        navigation.navigate('Register', { phone: formattedPhone });
      }
    } catch (error) {
      console.error('Error checking user:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Image Banner */}
      <Image 
        source={require('../assets/voting-box.png')}  // 👈 Replace with your image path
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>Secure Voting Authentication</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={10}
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  image: {width: 150,height: 150,alignSelf: 'center',marginBottom: 30,},
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, marginBottom: 20 },
  button: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16 },
});
