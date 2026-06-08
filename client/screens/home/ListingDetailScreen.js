import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, SafeAreaView, Alert, ActivityIndicator, Image
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { BASE_URL } from '../../utils/config';

const TIME_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];

export default function ListingDetailScreen({ route, navigation }) {
  const { listing, category } = route.params;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const listingId = listing._id || listing.id;
        const res = await axios.get(`${BASE_URL}/api/reviews/listing/${listingId}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    const checkFavorite = async () => {
      if (!user) return;
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.get(`${BASE_URL}/api/auth/favorites`, {
          headers: { 'x-auth-token': token }
        });
        const favIds = res.data.map(f => f._id || f);
        setIsFavorite(favIds.includes(listing._id || listing.id));
      } catch (err) { /* ignore */ }
    };

    fetchReviews();
    checkFavorite();
  }, [listing._id, listing.id, user]);

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
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('details')}</Text>
        <TouchableOpacity
          onPress={async () => {
            if (!user) {
              Alert.alert('Error', 'Please log in to favorite services.');
              return;
            }
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.post(`${BASE_URL}/api/auth/favorites/${listing._id || listing.id}`, {}, {
                headers: { 'x-auth-token': token }
              });
              setIsFavorite(res.data.includes(listing._id || listing.id));
              Alert.alert(isFavorite ? 'Removed from Wishlist' : 'Added to Wishlist');
            } catch (err) {
              console.error('Favorite Error:', err);
            }
          }}
          style={styles.favBtn}
        >
          <Text style={styles.favIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          {listing.image || listing.imageUrl ? (
            <Image
              source={{ uri: listing.image || listing.imageUrl }}
              style={styles.listingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconCircle}>
              <Text style={styles.bigIcon}>{category?.icon || '✨'}</Text>
            </View>
          )}
          <Text style={styles.itemName}>{listing.name}</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('ProfileScreen', {
              providerId: listing.providerId?._id || listing.providerId,
              providerName: listing.providerId?.name || 'Local Expert'
            })}
            style={styles.providerTag}
          >
            <Text style={styles.providerText}>
              {listing.providerId?.name || 'Local Expert'}
              {listing.providerId?.isVerified && <Text style={styles.verifiedIcon}> ✅</Text>}
            </Text>
            <Text style={styles.viewProfileTxt}> View Profile</Text>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price</Text>
              <Text style={styles.priceValue}>{listing.price}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Rating</Text>
              <Text style={styles.ratingValue}>
                ★ {listing.averageRating?.toFixed(1) || 'New'}
              </Text>
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: listing.available ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={[styles.statusText, { color: listing.available ? '#166534' : '#991b1b' }]}>
              {listing.available ? '● Available Now' : '● Currently Busy'}
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
              : t('book_now')}
          </Text>
        </TouchableOpacity>

        {/* Recent Reviews */}
        {reviews.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>{t('reviews')} ({reviews.length})</Text>
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
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 16,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  backIcon: {
    color: '#374151',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  headerTitle: {
    color: '#374151',
    fontSize: 22,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -0.5,
    flex: 1,
  },
  favBtn: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  favIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconCircle: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bigIcon: {
    fontSize: 44,
  },
  listingImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemName: {
    color: '#1f2937',
    fontSize: 24,
    fontFamily: 'Inter_800ExtraBold',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  providerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  providerText: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  viewProfileTxt: {
    color: '#374151',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginLeft: 8,
    textDecorationLine: 'underline',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  priceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter_800ExtraBold',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  ratingContainer: {
    alignItems: 'center',
    flex: 1,
  },
  ratingLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter_800ExtraBold',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    letterSpacing: 0.2,
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
    fontFamily: 'Inter_600SemiBold',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#1f2937',
    fontSize: 20,
    fontFamily: 'Inter_800ExtraBold',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  descriptionText: {
    color: '#4b5563',
    fontSize: 16,
    lineHeight: 26,
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_500Medium',
  },
  slotTextActive: {
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },
  bookBtn: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40, // Added spacing to separate from reviews
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  bookBtnText: {
    color: '#ffffff',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    fontFamily: 'Inter_700Bold',
  },
  reviewStars: {
    color: '#f59e0b',
    fontSize: 16,
  },
  reviewText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
});
