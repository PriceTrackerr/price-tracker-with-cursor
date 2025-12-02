import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: '#fff',
        fontSize: 24,
    },
});

export default function ProScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Pro Screen</Text>
        </View>
    );
}
