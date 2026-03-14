import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const TIME_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];

export default function ListingDetailScreen({ route, navigation }) {
  const { listing, category } = route.params;
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const listingId = listing._id || listing.id;
        const res = await axios.get(`http://10.113.112.195:5000/api/reviews/listing/${listingId}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    const filled = Math.round(rating);
    return '★'.repeat(filled) + '☆'.repeat(5 - filled);
  };

  const handleBookNow = () => {
    if (!user || user.role !== 'consumer') {
      Alert.alert('Error', 'Only Consumers can book services. Please log in as a Consumer.');
      return;
    }

    // Navigate to the new Calendar booking flow
    navigation.navigate('BookingScreen', { listing });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={[styles.iconCircle]}>
            <Text style={styles.bigIcon}>{category.icon}</Text>
          </View>
          <Text style={styles.itemName}>{listing.name}</Text>
          <Text style={styles.itemLocation}>👤 Provider: {listing.providerId?.name || 'Local'}</Text>
          <Text style={styles.itemRating}>₹{listing.price}</Text>

          <View style={[styles.badge, { backgroundColor: listing.available ? '#a4c3b2' : '#e5989b' }]}>
            <Text style={[styles.badgeText, { color: listing.available ? '#1b4332' : '#5c1b1b' }]}>
              {listing.available ? 'Available Now' : 'Currently Busy'}
            </Text>
          </View>

          {/* Star Rating */}
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStars}>{renderStars(listing.averageRating || 0)}</Text>
            <Text style={styles.ratingText}>
              {listing.averageRating ? `${listing.averageRating.toFixed(1)}` : 'New'} ({listing.totalReviews || 0} reviews)
            </Text>
          </View>
        </View>

        {/* Description (If any exists on the model, hardcoded placeholder for now since schema didn't have heavy desc use) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About this service</Text>
          <Text style={styles.descriptionText}>
            {listing.description || `This is a highly rated ${category.name} service provided by a verified local professional. Request a booking below.`}
          </Text>
        </View>

        {/* Note: Timeslots moved to BookingScreen */}

        {/* Book Button */}
        <TouchableOpacity
          style={[
            styles.bookBtn,
            (!listing.available) && styles.bookBtnDisabled
          ]}
          disabled={!listing.available}
          onPress={handleBookNow}
        >
          <Text style={styles.bookBtnText}>
            {!listing.available
              ? 'Service Unavailable'
              : 'Proceed to Schedule'}
          </Text>
        </TouchableOpacity>

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {reviews.slice(0, 5).map((review, idx) => (
              <View key={review._id || idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.reviewerId?.name || 'Anonymous'}</Text>
                  <Text style={styles.reviewStars}>{renderStars(review.rating)}</Text>
                </View>
                {review.reviewText ? (
                  <Text style={styles.reviewText}>{review.reviewText}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40, // Increased margin
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 16,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  backIcon: {
    color: '#111827',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  iconCircle: {
    backgroundColor: '#f3f4f6', // Replaced dynamic background with solid simple box
    borderRadius: 24,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bigIcon: {
    fontSize: 50,
  },
  itemName: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  itemLocation: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
  },
  itemRating: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 24,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  ratingStars: {
    color: '#f59e0b',
    fontSize: 20,
    marginRight: 8,
  },
  ratingText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  descriptionText: {
    color: '#6b7280',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slot: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '31%',
    alignItems: 'center',
  },
  slotActive: {
    borderColor: '#111827',
    backgroundColor: '#f3f4f6',
  },
  slotText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  slotTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  bookBtn: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  bookBtnDisabled: {
    backgroundColor: '#e5e7eb',
  },
  bookBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewStars: {
    color: '#f59e0b',
    fontSize: 16,
  },
  reviewText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
});
