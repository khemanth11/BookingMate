import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    FlatList, SafeAreaView, KeyboardAvoidingView, Platform,
    StatusBar, Linking, Alert, Image, Modal, ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRoute, useNavigation } from '@react-navigation/native';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BASE_URL } from '../../utils/config';

const API_URL = BASE_URL;
// Initialize socket outside component to prevent multiple connections
const socket = io(API_URL);

const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '';
    }
};

export default function ChatScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { bookingId, receiverName, receiverPhone, senderId } = route.params;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef(null);
    const [isCameraVisible, setIsCameraVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [cameraRef, setCameraRef] = useState(null);
    const [isSendingImage, setIsSendingImage] = useState(false);

    const handleCameraPress = async () => {
        if (!permission || !permission.granted) {
            const res = await requestPermission();
            if (!res.granted) {
                Alert.alert('Permission Denied', 'Camera permission is required to send photos.');
                return;
            }
        }
        setIsCameraVisible(true);
    };

    const sendImageMessage = async () => {
        if (!cameraRef) return;
        try {
            setIsSendingImage(true);
            const photo = await cameraRef.takePictureAsync({
                quality: 0.2, // Lower quality for faster socket transport
                base64: true,
                exif: false
            });

            const messageData = {
                bookingId,
                senderId,
                text: '',
                image: photo.base64
            };

            socket.emit('send_message', messageData);
            setIsCameraVisible(false);
        } catch (error) {
            console.error('Error taking and sending picture:', error);
            Alert.alert('Error', 'Failed to send photo.');
        } finally {
            setIsSendingImage(false);
        }
    };

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
        const timeStr = formatTime(item.createdAt);

        return (
            <View style={[styles.msgWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
                {!isMe && (
                    <View style={styles.avatarBubble}>
                        <Text style={styles.avatarText}>
                            {receiverName ? receiverName.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                )}
                <View style={[styles.msgBubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                    {item.image ? (
                        <Image
                            source={{ uri: `data:image/jpeg;base64,${item.image}` }}
                            style={styles.messageImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={[styles.msgText, isMe ? styles.msgTextRight : styles.msgTextLeft]}>{item.text}</Text>
                    )}
                    <View style={styles.bubbleFooter}>
                        <Text style={[styles.timeText, isMe ? styles.timeTextRight : styles.timeTextLeft]}>
                            {timeStr}
                        </Text>
                        {isMe && <Text style={styles.checkmarkText}> ✓✓</Text>}
                    </View>
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
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitleText}>{receiverName}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>Active Now</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.callActionBtn} onPress={handleCall}>
                        <Text style={styles.callActionIcon}>📞</Text>
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
                    <TouchableOpacity style={styles.attachBtn} onPress={handleCameraPress}>
                        <Text style={styles.attachIcon}>📸</Text>
                    </TouchableOpacity>
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

                {/* Camera Modal for Photo Messages */}
                <Modal visible={isCameraVisible} animationType="slide">
                    <View style={styles.cameraContainer}>
                        <CameraView
                            style={styles.camera}
                            ref={(ref) => setCameraRef(ref)}
                        >
                            <View style={styles.cameraOverlay}>
                                <Text style={styles.cameraTip}>Snap a photo to send in chat</Text>
                                {isSendingImage ? (
                                    <ActivityIndicator size="large" color="#ffffff" />
                                ) : (
                                    <View style={styles.cameraActions}>
                                        <TouchableOpacity 
                                            style={styles.captureBtn} 
                                            onPress={sendImageMessage}
                                        >
                                            <View style={styles.captureInner} />
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.cancelCameraBtn} 
                                            onPress={() => setIsCameraVisible(false)}
                                        >
                                            <Text style={styles.cancelCameraText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </CameraView>
                    </View>
                </Modal>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 60,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        padding: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        marginRight: 16,
    },
    backIcon: { color: '#0f172a', fontSize: 18, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1 },
    headerTitleText: { color: '#0f172a', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    statusText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
    callActionBtn: {
        backgroundColor: '#0f172a',
        padding: 12,
        borderRadius: 16,
    },
    callActionIcon: { fontSize: 18, color: '#ffffff' },
    chatContainer: { padding: 16, paddingBottom: 20 },
    msgWrapper: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 12,
    },
    msgLeft: { justifyContent: 'flex-start' },
    msgRight: { justifyContent: 'flex-end' },
    msgBubble: {
        maxWidth: '80%',
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
    },
    bubbleLeft: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    bubbleRight: {
        backgroundColor: '#0f172a',
        borderBottomRightRadius: 6,
    },
    msgText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500',
    },
    msgTextLeft: { color: '#0f172a' },
    msgTextRight: { color: '#ffffff' },
    inputContainer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    input: {
        flex: 1,
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        fontWeight: '500',
    },
    sendBtn: {
        backgroundColor: '#0f172a',
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sendIcon: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
    avatarBubble: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    avatarText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: 'bold',
    },
    bubbleFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    timeText: {
        fontSize: 10,
    },
    timeTextLeft: {
        color: '#64748b',
    },
    timeTextRight: {
        color: '#94a3b8',
    },
    checkmarkText: {
        fontSize: 10,
        color: '#3b82f6',
        fontWeight: 'bold',
    },
    attachBtn: {
        backgroundColor: '#f1f5f9',
        width: 52,
        height: 52,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    attachIcon: { fontSize: 20 },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: 14,
        marginBottom: 4,
    },
    cameraContainer: { flex: 1, backgroundColor: '#000' },
    camera: { flex: 1 },
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40
    },
    cameraTip: {
        color: '#ffffff',
        fontSize: 14,
        fontFamily: 'Inter_700Bold',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    cameraActions: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#ffffff'
    },
    cancelCameraBtn: {
        position: 'absolute',
        right: 40,
        padding: 10
    },
    cancelCameraText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold'
    },
});
