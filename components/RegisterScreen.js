import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ route, navigation }) {
  const { phone } = route.params;

  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyOtp = async () => {
    if (otp !== '123456') {
      Alert.alert('Invalid OTP', 'Please enter the correct test code: 123456');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setIsVerifying(true);

    try {
      await AsyncStorage.setItem(phone, JSON.stringify({ name }));
      await AsyncStorage.setItem('isLoggedIn', 'true');

      Alert.alert('Registration Successful', `Welcome, ${name}!`);

      navigation.reset({
        index: 0,
        routes: [{ name: 'OngoingPolls' }],
      });
    } catch (error) {
      console.error('Error saving user:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to {phone}</Text>

        <TextInput
          style={styles.input}
          placeholder="6-digit OTP"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />

        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={[styles.button, isVerifying && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify & Register</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  scrollContainer: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#333' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666' },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ac9f5',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
