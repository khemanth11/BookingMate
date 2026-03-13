import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
    StatusBar, Linking, Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.113.112.195:5000';
// Initialize socket outside component to prevent multiple connections
const socket = io(API_URL);

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { bookingId, receiverName, receiverPhone, senderId } = route.params;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);

    useEffect(() => {
        fetchPreviousMessages();

        // Join the specific booking chat room
        socket.emit('join_room', bookingId);

        // Listen for incoming messages
        socket.on('receive_message', (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        // Cleanup on unmount
        return () => {
            socket.off('receive_message');
        };
    }, []);

    const fetchPreviousMessages = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/messages/${bookingId}`, {
                headers: { 'x-auth-token': token }
            });
            setMessages(res.data);
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
            }, 200);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        const messageData = {
            bookingId,
            senderId,
            text: inputText.trim()
        };

        // Emit to server
        socket.emit('send_message', messageData);
        setInputText('');
    };

    const handleCall = () => {
        if (!receiverPhone) {
            Alert.alert('Unavailable', 'Phone number not provided.');
            return;
        }
        // Use React Native Linking to open the phone dialer
        Linking.openURL(`tel:${receiverPhone}`);
    };

    const renderMessage = ({ item }) => {
        const isMe = item.senderId === senderId;

        return (
            <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
                <View style={[styles.msgBubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>{item.text}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>{receiverName}</Text>
                        <Text style={styles.headerSub}>Live Chat</Text>
                    </View>

                    <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                        <Text style={styles.callIcon}>📞</Text>
                    </TouchableOpacity>
                </View>

                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item._id || Math.random().toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatContainer}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type your message..."
                        placeholderTextColor="#9CA3AF"
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                        <Text style={styles.sendIcon}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f5f6f8' },
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 36, // Added margin from top
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backBtn: { padding: 4 },
    backIcon: { color: '#111827', fontSize: 22, fontWeight: 'bold' },
    headerInfo: { flex: 1, marginLeft: 16 },
    headerTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
    headerSub: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
    callBtn: {
        backgroundColor: '#f3f4f6',
        padding: 12,
        borderRadius: 20,
    },
    callIcon: { fontSize: 20 },
    chatContainer: { padding: 16, paddingBottom: 20 },
    msgWrapper: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 12,
    },
    msgLeft: { justifyContent: 'flex-start' },
    msgRight: { justifyContent: 'flex-end' },
    msgBubble: {
        maxWidth: '78%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    bubbleLeft: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    bubbleRight: {
        backgroundColor: '#111827',
        borderBottomRightRadius: 4,
    },
    msgText: {
        fontSize: 15,
        lineHeight: 22,
    },
    msgTextLeft: { color: '#111827' },
    msgTextRight: { color: '#ffffff' },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        color: '#111827',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 15,
        marginRight: 12,
    },
    sendBtn: {
        backgroundColor: '#111827',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});
