import React, { useState } from 'react';
import { useStateContext } from '../context';
import ConfirmationModal from './ConfirmationModal';

const DeleteCampaignButton = ({ 
  campaign, 
  onSuccess, 
  onError,
  className = "",
  variant = "danger" // "danger", "outline", "text"
}) => {
  const { deleteCampaign, address } = useStateContext();
  const [showModal, setShowModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the campaign owner
  const isOwner = campaign.owner?.toLowerCase() === address?.toLowerCase();

  // Don't render if user is not the owner
  if (!isOwner) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCampaign(campaign.pId);
      setShowModal(false);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(campaign);
      }
      
      // You might want to refresh the campaigns list here
      // or handle it in the parent component
      
    } catch (error) {
      console.error('Delete campaign error:', error);
      
      // Call error callback if provided
      if (onError) {
        onError(error);
      } else {
        // Default error handling
        alert(`Failed to delete campaign: ${error.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getButtonClasses = () => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (variant) {
      case "danger":
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      case "outline":
        return `${baseClasses} border-2 border-red-600 text-red-600 hover:bg-red-50`;
      case "text":
        return `${baseClasses} text-red-600 hover:bg-red-50`;
      default:
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isDeleting}
        className={`${getButtonClasses()} ${className}`}
      >
        {isDeleting ? 'Deleting...' : 'Delete Campaign'}
      </button>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign.title}"? This action cannot be undone and any collected funds will be refunded to you.`}
        confirmText="Delete Campaign"
        isLoading={isDeleting}
      />
    </>
  );
};

export default DeleteCampaignButton;