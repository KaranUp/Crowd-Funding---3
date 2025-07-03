// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// These are the types that are used in the contract
contract CrowdFunding {
    struct Campaign {
        address owner; // The owner of the campaign
        string title; // The title of the campaign
        string description; // The description of the campaign
        uint256 target; // The target amount of the campaign
        uint256 deadline; // The deadline of the campaign
        uint256 amountCollected;  // The amount collected so far
        string image; // The image of the campaign
        address[] donators; // The list of donators
        uint256[] donations; // The list of donations
        bool isActive; // Whether the campaign is active or deleted
    }

// mapping of campaign id to campaign struct for easy access of campaign data
    mapping(uint256 => Campaign) public campaigns;

    uint256 public numberOfCampaigns = 0;

    // Events
    event CampaignCreated(uint256 indexed campaignId, address indexed owner, string title);
    event CampaignDeleted(uint256 indexed campaignId, address indexed owner);
    event DonationMade(uint256 indexed campaignId, address indexed donator, uint256 amount);

// Function to Create Campaign 
    function createCampaign(address _owner, string memory _title, string memory _description, 
                                uint256 _target, uint256 _deadline, 
                                    string memory _image) public returns (uint256) {                                        
        Campaign storage campaign = campaigns[numberOfCampaigns];

        require(_deadline > block.timestamp, "The deadline should be a date in the future.");

        campaign.owner = _owner;
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountCollected = 0;
        campaign.image = _image;
        campaign.isActive = true;

        emit CampaignCreated(numberOfCampaigns, _owner, _title);
        
        numberOfCampaigns++;
        
        return numberOfCampaigns - 1;
    }

// Function to delete campaign
    function deleteCampaign(uint256 _id) public {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        
        Campaign storage campaign = campaigns[_id];
        
        require(campaign.isActive, "Campaign is already deleted");
        require(campaign.owner == msg.sender, "Only campaign owner can delete this campaign");
        
        // Optional: Only allow deletion if campaign hasn't reached target
        // require(campaign.amountCollected < campaign.target, "Cannot delete successful campaign");
        
        // Optional: Only allow deletion before deadline
        // require(block.timestamp < campaign.deadline, "Cannot delete campaign after deadline");
        
        // If there are collected funds, refund them to the campaign owner
        if (campaign.amountCollected > 0) {
            (bool sent,) = payable(campaign.owner).call{value: campaign.amountCollected}("");
            require(sent, "Failed to refund collected amount");
        }
        
        // Mark campaign as inactive instead of deleting the struct
        // This preserves the campaign data but makes it inaccessible
        campaign.isActive = false;
        
        emit CampaignDeleted(_id, msg.sender);
    }

// Function to Donate to Campaign
    function donateToCampaign(uint256 _id) public payable {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        
        Campaign storage campaign = campaigns[_id];
        
        require(campaign.isActive, "Campaign is not active");
        require(block.timestamp < campaign.deadline, "Campaign deadline has passed");
        
        uint256 amount = msg.value;
        require(amount > 0, "Donation amount must be greater than 0");

        campaign.donators.push(msg.sender);
        campaign.donations.push(amount);

        (bool sent,) = payable(campaign.owner).call{value: amount}("");

        if(sent) {
            campaign.amountCollected += amount;
            emit DonationMade(_id, msg.sender, amount);
        }
    }
    

// Function for Donators
    function getDonators(uint256 _id) view public returns (address[] memory, uint256[] memory) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        require(campaigns[_id].isActive, "Campaign is not active");
        
        return (campaigns[_id].donators, campaigns[_id].donations);
    }
    

// Function to get Campaign Details
    function getCampaigns() public view returns (Campaign[] memory) {
        // Count active campaigns
        uint256 activeCampaignCount = 0;
        for(uint i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].isActive) {
                activeCampaignCount++;
            }
        }
        
        // Create array with only active campaigns
        Campaign[] memory activeCampaigns = new Campaign[](activeCampaignCount);
        uint256 currentIndex = 0;
        
        for(uint i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].isActive) {
                Campaign storage item = campaigns[i];
                activeCampaigns[currentIndex] = item;
                currentIndex++;
            }
        }

        return activeCampaigns;
    }

// Function to get a specific campaign by ID
    function getCampaign(uint256 _id) public view returns (Campaign memory) {
        require(_id < numberOfCampaigns, "Campaign does not exist");
        require(campaigns[_id].isActive, "Campaign is not active");
        
        return campaigns[_id];
    }

// Function to get campaigns owned by a specific address
    function getCampaignsByOwner(address _owner) public view returns (Campaign[] memory) {
        // Count campaigns owned by the address
        uint256 ownerCampaignCount = 0;
        for(uint i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].owner == _owner && campaigns[i].isActive) {
                ownerCampaignCount++;
            }
        }
        
        // Create array with campaigns owned by the address
        Campaign[] memory ownerCampaigns = new Campaign[](ownerCampaignCount);
        uint256 currentIndex = 0;
        
        for(uint i = 0; i < numberOfCampaigns; i++) {
            if(campaigns[i].owner == _owner && campaigns[i].isActive) {
                Campaign storage item = campaigns[i];
                ownerCampaigns[currentIndex] = item;
                currentIndex++;
            }
        }

        return ownerCampaigns;
    }
}