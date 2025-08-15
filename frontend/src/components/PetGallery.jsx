import React, { useState, useEffect } from 'react';
import { Camera, Heart, MessageCircle, Upload, Star, Share2, Trash2, Send, X } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api/v1';

const PetGallery = ({ userId, showUpload = true }) => {
  const [photos, setPhotos] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserPets();
      fetchPhotos();
    }
  }, [userId]);

  const fetchUserPets = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/pets`);
      setUserPets(response.data.pets || []);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/${userId}/photos`);
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Failed to fetch photos:', error);
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (file, petId, caption = '') => {
    if (!file || !petId) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('pet_id', petId);
    formData.append('caption', caption);
    formData.append('photo_type', 'customer_upload');

    try {
      setUploadingPhoto(true);
      await axios.post(`${API_BASE_URL}/pets/${petId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowUploadModal(false);
      fetchPhotos(); // Refresh gallery
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleLike = async (photoId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/photos/${photoId}/like`);
      
      // Update the photo in the local state immediately for better UX
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => 
          photo.id === photoId 
            ? { ...photo, like_count: response.data.like_count }
            : photo
        )
      );
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDeletePhoto = async (photoId, photoCaption) => {
    const confirmMessage = `Are you sure you want to delete this photo${photoCaption ? ` "${photoCaption}"` : ''}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/photos/${photoId}`);
      fetchPhotos(); // Refresh gallery
      alert('Photo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  };

  const handleShowComments = async (photoId) => {
    setSelectedPhotoId(photoId);
    setShowCommentsModal(true);
    setLoadingComments(true);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/photos/${photoId}/comments`);
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedPhotoId) return;

    setSubmittingComment(true);
    try {
      await axios.post(`${API_BASE_URL}/photos/${selectedPhotoId}/comments`, {
        comment_text: newComment.trim()
      });
      
      // Refresh comments
      const response = await axios.get(`${API_BASE_URL}/photos/${selectedPhotoId}/comments`);
      setComments(response.data.comments || []);
      
      // Update comment count in photos state
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => 
          photo.id === selectedPhotoId 
            ? { ...photo, comment_count: (photo.comment_count || 0) + 1 }
            : photo
        )
      );
      
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const PhotoCard = ({ photo }) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img 
          src={photo.photo_url} 
          alt={photo.caption || `${photo.pet_name} photo`}
          className="w-full h-56 object-cover"
        />
        
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        
        {/* Photo type badges */}
        {photo.photo_type === 'after_groom' && (
          <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
            <Star className="h-3 w-3 mr-1" />
            Fresh Groom
          </div>
        )}
        {photo.photo_type === 'before_groom' && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            Before Spa
          </div>
        )}
        {photo.photo_type === 'customer_upload' && (
          <div className="absolute top-3 right-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
            My Photo
          </div>
        )}
        
        {/* Pet name overlay */}
        <div className="absolute bottom-3 left-3">
          <h3 className="font-semibold text-white text-lg drop-shadow-lg">{photo.pet_name}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {new Date(photo.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
        
        {photo.caption && (
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">{photo.caption}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => toggleLike(photo.id)}
              className="flex items-center text-gray-400 hover:text-red-500 transition-colors group"
            >
              <Heart className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{photo.like_count || 0}</span>
            </button>
            
            <button 
              onClick={() => handleShowComments(photo.id)}
              className="flex items-center text-gray-400 hover:text-blue-500 transition-colors group"
            >
              <MessageCircle className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">{photo.comment_count || 0}</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full">
              <Share2 className="h-4 w-4" />
            </button>
            
            {showUpload && (
              <button 
                onClick={() => handleDeletePhoto(photo.id, photo.caption)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                title="Delete photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Upload Pet Photo</h3>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const file = formData.get('photo');
          const petId = formData.get('pet_id');
          const caption = formData.get('caption');
          
          if (file && petId) {
            handlePhotoUpload(file, petId, caption);
          }
        }}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Pet
            </label>
            <select 
              name="pet_id" 
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">Choose a pet...</option>
              {userPets.map(pet => (
                <option key={pet.id} value={pet.id}>{pet.name}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo
            </label>
            <input 
              type="file" 
              name="photo"
              accept="image/*"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption (optional)
            </label>
            <textarea 
              name="caption"
              rows="3"
              placeholder="Say something about this photo..."
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button 
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={uploadingPhoto}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-sm border border-blue-100/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center mb-2">
            <Camera className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">My Pet Memories</h2>
          </div>
          <p className="text-sm text-gray-600">Beautiful moments with your furry friends</p>
        </div>
        
        {showUpload && (
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
          >
            <Upload className="h-4 w-4 mr-2" />
            Add Photo
          </button>
        )}
      </div>

      {/* Photo Gallery */}
      {loading ? (
        <div className="text-center py-16">
          <Camera className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your precious memories...</p>
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map(photo => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
          <Camera className="h-16 w-16 text-blue-400 mx-auto mb-6" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your Pet Memory Gallery Awaits</h3>
          <p className="text-gray-600 mb-6">Start building beautiful memories of your furry friends</p>
          {showUpload && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
            >
              Upload Your First Photo
            </button>
          )}
        </div>
      )}

      {showUploadModal && <UploadModal />}
      {showCommentsModal && <CommentsModal />}
    </div>
  );

  function CommentsModal() {
    const selectedPhoto = photos.find(p => p.id === selectedPhotoId);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold">Comments</h3>
              {selectedPhoto && (
                <span className="ml-2 text-sm text-gray-500">
                  on {selectedPhoto.pet_name}'s photo
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowCommentsModal(false)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingComments ? (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-blue-400 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">Loading comments...</p>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {comment.commenter_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center mb-1">
                          <span className="font-semibold text-sm text-gray-900">
                            {comment.commenter_name}
                          </span>
                          {comment.commenter_role === 'staff' && (
                            <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Staff
                            </span>
                          )}
                          <span className="ml-auto text-xs text-gray-500">
                            {comment.relative_time}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.comment_text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No comments yet</p>
                <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <div className="border-t p-4">
            <form onSubmit={handleAddComment} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  U
                </div>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="2"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newComment.trim() || submittingComment}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submittingComment ? (
                      <>
                        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3 mr-2" />
                        Post Comment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
};

export default PetGallery;