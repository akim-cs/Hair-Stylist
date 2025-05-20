document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.reviews-container');
  const avgDisplay = document.createElement('div');
  avgDisplay.className = 'average-rating';
  container.prepend(avgDisplay);

  // Add developer tools container (hidden by default)
  const devTools = document.createElement('div');
  devTools.className = 'dev-tools';
  devTools.innerHTML = `
    <div class="dev-tools-toggle">
      <button class="dev-toggle-btn">Developer Tools</button>
      <div class="dev-panel">
        <div class="dev-actions">
          <h4>Delete Reviews</h4>
          <p>Select a review and click delete to remove it.</p>
        </div>
      </div>
    </div>
  `;
  container.parentNode.insertBefore(devTools, container.nextSibling);

  // Toggle developer panel
  const devToggleBtn = document.querySelector('.dev-toggle-btn');
  const devPanel = document.querySelector('.dev-panel');
  
  devToggleBtn.addEventListener('click', () => {
    devPanel.classList.toggle('active');
    if (devPanel.classList.contains('active')) {
      document.querySelectorAll('.review-card').forEach(card => {
        // Add delete button to each review
        if (!card.querySelector('.delete-review-btn')) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-review-btn';
          deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const reviewId = card.dataset.reviewId;
            if (confirm('Are you sure you want to delete this review?')) {
              deleteReview(reviewId);
            }
          });
          card.appendChild(deleteBtn);
        }
      });
    }
  });

  // Fetch and display existing reviews
  fetchReviews();

  // Set up star rating functionality
  const form = document.getElementById('review-form');
  const stars = document.querySelectorAll('.star-rating i');
  let selectedRating = 0;

  // Add hover effect to stars
  stars.forEach(star => {
    // Hover functionality
    star.addEventListener('mouseenter', () => {
      const rating = parseInt(star.dataset.rating);
      highlightStars(rating);
    });

    // Remove hover effect if no star is selected
    star.addEventListener('mouseleave', () => {
      if (selectedRating === 0) {
        resetStars();
      } else {
        highlightStars(selectedRating);
      }
    });

    // Click functionality
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating);
      highlightStars(selectedRating);
    });
  });

  // Helper function to highlight stars up to a certain rating
  function highlightStars(rating) {
    stars.forEach(s => {
      const r = parseInt(s.dataset.rating);
      if (r <= rating) {
        s.classList.remove('far');
        s.classList.add('fas');
      } else {
        s.classList.remove('fas');
        s.classList.add('far');
      }
    });
  }

  // Helper function to reset all stars
  function resetStars() {
    stars.forEach(s => {
      s.classList.remove('fas');
      s.classList.add('far');
    });
  }

  // Form submission handler
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('reviewer-name').value;
    const comment = document.getElementById('review-text').value;

    if (!name || !comment || !selectedRating) {
      alert('Please fill all fields and select a rating.');
      return;
    }

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating: selectedRating, comment })
      });

      if (res.ok) {
        // Clear form
        form.reset();
        selectedRating = 0;
        resetStars();
        
        // Display success message
        alert('Thank you for your review!');
        
        // Fetch updated reviews instead of reloading the page
        fetchReviews();
        
        // Smooth scroll to reviews section to see the new review
        document.getElementById('reviews').scrollIntoView({ behavior: 'smooth' });
      } else {
        alert('Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred. Please try again later.');
    }
  });
  
  // Function to fetch and display reviews
  function fetchReviews() {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        // Clear previous reviews but keep the average rating display
        const avgRatingElement = container.querySelector('.average-rating');
        container.innerHTML = '';
        container.appendChild(avgRatingElement);
        
        let total = 0;

        data.forEach(review => {
          total += review.rating;
          const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
          
          const reviewCard = document.createElement('div');
          reviewCard.className = 'review-card';
          reviewCard.dataset.reviewId = review.id;
          reviewCard.innerHTML = `
            <div class="review-header">
              <div class="reviewer-info">
                <h4>${review.name}</h4>
                <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
              </div>
              <div class="stars">${stars}</div>
            </div>
            <div class="review-content">
              <p>${review.comment}</p>
            </div>`;
          
          container.appendChild(reviewCard);
        });

        if (data.length > 0) {
          const avg = (total / data.length).toFixed(2);
          // Generate visualization for average stars with half-star precision
          const avgStars = generateStarRating(avg);
          avgRatingElement.innerHTML = `
            <div class="avg-rating-text">Average Rating: ${avg}</div>
            <div class="avg-rating-stars">${avgStars}</div>
          `;
        } else {
          avgRatingElement.textContent = 'Be the first to leave a review!';
        }

        // Re-add delete buttons if dev panel is open
        if (document.querySelector('.dev-panel.active')) {
          document.querySelectorAll('.review-card').forEach(card => {
            if (!card.querySelector('.delete-review-btn')) {
              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'delete-review-btn';
              deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
              deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reviewId = card.dataset.reviewId;
                if (confirm('Are you sure you want to delete this review?')) {
                  deleteReview(reviewId);
                }
              });
              card.appendChild(deleteBtn);
            }
          });
        }
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
        container.innerHTML = '<p>Failed to load reviews. Please refresh the page to try again.</p>';
      });
  }

  // Generate star rating with half-star precision
  function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }
    
    // Add half star if applicable
    if (halfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
  }

  // Function to delete a review
  async function deleteReview(reviewId) {
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchReviews(); // Refresh the reviews after deletion
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('An error occurred while trying to delete the review.');
    }
  }
});
  