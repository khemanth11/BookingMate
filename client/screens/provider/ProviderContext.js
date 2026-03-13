import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { Alert } from 'react-native';

const ProviderContext = createContext();

const API_URL = 'http://10.113.112.195:5000/api/listings';

export const ProviderProvider = ({ children }) => {
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    // Helper to get authenticated interceptor setup
    const getAuthHeaders = async () => {
        const token = await AsyncStorage.getItem('token');
        return { headers: { 'x-auth-token': token } };
    };

    // Fetch the logged-in provider's listings
    const fetchMyListings = useCallback(async () => {
        if (!user || user.role !== 'provider') return;

        setIsLoading(true);
        try {
            const config = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/me`, config);
            // Replace local state with backend db array (use _id instead of id)
            // We map _id to id so the rest of the app doesn't break
            const mappedListings = res.data.map(item => ({ ...item, id: item._id }));
            setListings(mappedListings);
        } catch (error) {
            console.error('Error fetching listings:', error);
            Alert.alert('Error', 'Failed to load your listings');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial load when context mounts & user is present
    useEffect(() => {
        fetchMyListings();
    }, [fetchMyListings]);

    const addListing = async (listingData) => {
        setIsLoading(true);
        try {
            const config = await getAuthHeaders();
            const res = await axios.post(API_URL, listingData, config);
            const newListing = { ...res.data, id: res.data._id };
            setListings((prev) => [...prev, newListing]);
            return true;
        } catch (error) {
            console.error('Error adding listing:', error);
            Alert.alert('Error', 'Failed to create listing');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const editListing = async (id, updatedData) => {
        setIsLoading(true);
        try {
            const config = await getAuthHeaders();
            const res = await axios.put(`${API_URL}/${id}`, updatedData, config);
            const updatedListing = { ...res.data, id: res.data._id };
            setListings((prev) => prev.map((item) => (item.id === id ? updatedListing : item)));
            return true;
        } catch (error) {
            console.error('Error editing listing:', error);
            Alert.alert('Error', 'Failed to update listing');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteListing = async (id) => {
        setIsLoading(true);
        try {
            const config = await getAuthHeaders();
            await axios.delete(`${API_URL}/${id}`, config);
            setListings((prev) => prev.filter((item) => item.id !== id));
            return true;
        } catch (error) {
            console.error('Error deleting listing:', error);
            Alert.alert('Error', 'Failed to delete listing');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProviderContext.Provider value={{
            listings,
            isLoading,
            addListing,
            editListing,
            deleteListing,
            refreshListings: fetchMyListings
        }}>
            {children}
        </ProviderContext.Provider>
    );
};

export const useProvider = () => useContext(ProviderContext);
