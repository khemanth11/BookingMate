import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, SafeAreaView, Alert, ActivityIndicator
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

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
        const res = await axios.get(`http://10.113.112.195:5000/api/reviews/listing/${listingId}`);
        setReviews(res.data || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };
    
    const checkFavorite = async () => {
        if (!user) return;
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`http://10.113.112.195:5000/api/auth/favorites`, {
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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6f8" />

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
              const res = await axios.post(`http://10.113.112.195:5000/api/auth/favorites/${listing._id || listing.id}`, {}, {
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
          <View style={styles.iconCircle}>
            <Text style={styles.bigIcon}>{category.icon}</Text>
          </View>
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
              <Text style={styles.priceValue}>₹{listing.price}</Text>
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
    flex: 1,
  },
  favBtn: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  favIcon: {
    fontSize: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
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
  itemName: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  providerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 28,
  },
  providerText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  viewProfileTxt: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  priceContainer: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    color: '#0f172a',
    fontWeight: '900',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  ratingContainer: {
    alignItems: 'center',
    flex: 1,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 24,
    color: '#f59e0b',
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontWeight: '800',
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
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  descriptionText: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '500',
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
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  bookBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  bookBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
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
