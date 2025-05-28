import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function VoteScreen({ route, navigation }) {
  const { poll } = route.params;
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async () => {
    if (selectedOption === null) {
      Alert.alert('No Selection', 'Please select an option to vote.');
      return;
    }
  
    setIsSubmitting(true);
    try {
      const storedPolls = await AsyncStorage.getItem('ONGOING_POLLS');
      let polls = storedPolls ? JSON.parse(storedPolls) : [];
  
      // Find and update the poll
      const updatedPolls = polls.map((p) => {
        if (p.title === poll.title) {
          const updatedOptions = p.options.map(option => ({
            ...option,
            votes: option.votes || 0
          }));
          
          updatedOptions[selectedOption].votes += 1;
          
          return {
            ...p,
            options: updatedOptions
          };
        }
        return p;
      });
  
      await AsyncStorage.setItem('ONGOING_POLLS', JSON.stringify(updatedPolls));
  
      const selectedOptionText = poll.options[selectedOption]?.text || 'Unknown Option';
  
      Alert.alert(
        'Vote Submitted',
        `You voted for "${selectedOptionText}"`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('LiveResults', { poll: {
              ...poll,
              options: poll.options.map((opt, idx) => ({
                ...opt,
                votes: idx === selectedOption ? (opt.votes || 0) + 1 : opt.votes || 0
              }))
            }}),
          },
        ]
      );
    } catch (error) {
      console.log('Error storing vote:', error);
      Alert.alert('Error', 'Failed to submit your vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{poll.title}</Text>
      <Text style={styles.subtitle}>Select your choice:</Text>

      {poll.options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.optionButton,
            selectedOption === index && styles.selectedOption,
          ]}
          onPress={() => setSelectedOption(index)}
          disabled={isSubmitting}
        >
          <Text style={styles.optionText}>{option.text}</Text>
          {selectedOption === index && (
            <Ionicons name="checkmark-circle" size={20} color="green" style={styles.checkIcon} />
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={[styles.voteButton, isSubmitting && styles.disabledButton]} 
        onPress={handleVote}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.voteButtonText}>Submit Vote</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f9f9f9' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  subtitle: { fontSize: 18, marginBottom: 20, textAlign: 'center', color: '#555' },
  optionButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: 'blue',
    borderWidth: 2,
    backgroundColor: '#e6f0ff',
  },
  optionText: { fontSize: 18 },
  checkIcon: { marginLeft: 10 },
  voteButton: {
    backgroundColor: 'blue',
    padding: 16,
    borderRadius: 8,
    marginTop: 30,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  voteButtonText: { 
    color: 'white', 
    fontSize: 18, 
    textAlign: 'center' 
  },
});