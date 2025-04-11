import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Card, Button, Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StackParamList } from '../../types/navigation';

type PrivacyCenterNavigationProp = StackNavigationProp<StackParamList, 'PrivacyCenter'>;

/**
 * Privacy Center Screen
 * Main hub for accessing privacy features
 */
const PrivacyCenterScreen: React.FC = () => {
  const navigation = useNavigation<PrivacyCenterNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Privacy Center</Text>
        <Text style={styles.subtitle}>Manage your privacy settings and data</Text>
        
        {/* Data Access Card */}
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Data Access & Export</Card.Title>
          <Card.Divider />
          <Text style={styles.cardText}>
            Access and export your personal data in various formats
          </Text>
          <Button
            icon={
              <Icon 
                name="download" 
                type="feather" 
                color="#fff" 
                size={18} 
                style={styles.buttonIcon} 
              />
            }
            title="Manage Data"
            onPress={() => navigation.navigate('DataAccess')}
            buttonStyle={styles.button}
            titleStyle={styles.buttonTitle}
          />
        </Card>
        
        {/* Consent Management Card */}
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Consent Management</Card.Title>
          <Card.Divider />
          <Text style={styles.cardText}>
            Control how your data is used and processed
          </Text>
          <Button
            icon={
              <Icon 
                name="check-circle" 
                type="feather" 
                color="#fff" 
                size={18} 
                style={styles.buttonIcon} 
              />
            }
            title="Manage Consent"
            onPress={() => navigation.navigate('ConsentManagement')}
            buttonStyle={styles.button}
            titleStyle={styles.buttonTitle}
          />
        </Card>
        
        {/* Account Management Card */}
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Account Management</Card.Title>
          <Card.Divider />
          <Text style={styles.cardText}>
            Delete or anonymize your account and data
          </Text>
          <Button
            icon={
              <Icon 
                name="user-x" 
                type="feather" 
                color="#fff" 
                size={18} 
                style={styles.buttonIcon} 
              />
            }
            title="Manage Account"
            onPress={() => navigation.navigate('AccountManagement')}
            buttonStyle={styles.button}
            titleStyle={styles.buttonTitle}
          />
        </Card>
        
        {/* Privacy Information Card */}
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Privacy Information</Card.Title>
          <Card.Divider />
          <Text style={styles.cardText}>
            Learn about our privacy practices and your rights
          </Text>
          <Button
            icon={
              <Icon 
                name="info" 
                type="feather" 
                color="#fff" 
                size={18} 
                style={styles.buttonIcon} 
              />
            }
            title="View Information"
            onPress={() => navigation.navigate('PrivacyInformation')}
            buttonStyle={styles.button}
            titleStyle={styles.buttonTitle}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
  },
  cardText: {
    marginBottom: 16,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FF006E',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default PrivacyCenterScreen;