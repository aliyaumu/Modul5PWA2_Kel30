import { apiClient, IS_SUPABASE } from '../config/api'
import queryCache from '../utils/queryCache'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings with query caching.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    const cacheKey = `reviews_${gunId}`
    const cached = queryCache.get(cacheKey)
    if (cached) {
      return cached
    }

    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
      )
      const list = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
          }))
        : []

      const result = { success: true, data: list }
      queryCache.set(cacheKey, result)
      return result
    }

    const result = await apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
    queryCache.set(cacheKey, result)
    return result
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    queryCache.invalidate('reviews')
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      return { success: true, data: created }
    }

    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    queryCache.invalidate('reviews')
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    return apiClient.put(`/api/v1/recipes/${reviewId}`, reviewData)
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    queryCache.invalidate('reviews')
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      return { success: true }
    }

    return apiClient.delete(`/api/v1/reviews/${reviewId}`)
  }
}

export default new ReviewService()
