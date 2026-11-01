// ---------------------------------------------------------------------------
// reactionStorage.js — Thumbs up / Thumbs down review reactions
// ---------------------------------------------------------------------------

const REACTION_KEY = 'bore_barrel_review_reactions'

export const getAllReactions = () => {
  try {
    const raw = localStorage.getItem(REACTION_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export const getReviewReaction = (reviewId) => {
  if (!reviewId) return { likes: 0, dislikes: 0, userVote: null }
  const all = getAllReactions()
  const data = all[String(reviewId)]
  return data || { likes: 0, dislikes: 0, userVote: null }
}

export const toggleReviewReaction = (reviewId, type) => {
  if (!reviewId || (type !== 'up' && type !== 'down')) return null

  const all = getAllReactions()
  const key = String(reviewId)
  const current = all[key] || { likes: 0, dislikes: 0, userVote: null }

  let newLikes = current.likes || 0
  let newDislikes = current.dislikes || 0
  let newUserVote = current.userVote

  if (type === 'up') {
    if (newUserVote === 'up') {
      // Undo upvote
      newLikes = Math.max(0, newLikes - 1)
      newUserVote = null
    } else if (newUserVote === 'down') {
      // Switch from down to up
      newDislikes = Math.max(0, newDislikes - 1)
      newLikes += 1
      newUserVote = 'up'
    } else {
      // New upvote
      newLikes += 1
      newUserVote = 'up'
    }
  } else if (type === 'down') {
    if (newUserVote === 'down') {
      // Undo downvote
      newDislikes = Math.max(0, newDislikes - 1)
      newUserVote = null
    } else if (newUserVote === 'up') {
      // Switch from up to down
      newLikes = Math.max(0, newLikes - 1)
      newDislikes += 1
      newUserVote = 'down'
    } else {
      // New downvote
      newDislikes += 1
      newUserVote = 'down'
    }
  }

  const updatedEntry = {
    likes: newLikes,
    dislikes: newDislikes,
    userVote: newUserVote,
  }

  all[key] = updatedEntry
  try {
    localStorage.setItem(REACTION_KEY, JSON.stringify(all))
  } catch {
    // ignore
  }

  return updatedEntry
}

export default {
  getReviewReaction,
  toggleReviewReaction,
}
