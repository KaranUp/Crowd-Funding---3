import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { useChain } from "@thirdweb-dev/react";

import { useStateContext } from "../context";
import { money } from "../assets";
import { CustomButton, FormField } from "../components";
import { checkIfImage } from "../utils";

// Loading Overlay Component
const LoadingOverlay = ({ message }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-[#3a3a43] p-6 rounded-lg">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1dc071] mx-auto"></div>
      <p className="mt-4 text-white font-epilogue">{message}</p>
    </div>
  </div>
);

// Progress Steps Component
const ProgressSteps = ({ currentStep }) => {
  const steps = [
    "Connect Wallet",
    "Fill Details",
    "Validate",
    "Create Campaign",
  ];

  return (
    <div className="flex justify-between mb-8 px-4">
      {steps.map((step, index) => (
        <div key={step} className="flex-1 text-center">
          <div
            className={`text-sm ${
              index <= currentStep ? "text-[#1dc071]" : "text-gray-400"
            }`}
          >
            {step}
          </div>
          <div
            className={`mt-2 h-1 rounded ${
              index <= currentStep ? "bg-[#1dc071]" : "bg-gray-600"
            }`}
          ></div>
        </div>
      ))}
    </div>
  );
};

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [gasCost, setGasCost] = useState(null);
  const chain = useChain();

  const {
    createCampaign,
    address,
    connectWallet,
    switchToSepolia,
    contractLoading,
    contractError,
    networkError,
    isConnecting,
    estimateGasCost,
  } = useStateContext();

  const [form, setForm] = useState({
    name: "",
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
  });

  // Load draft from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem("campaignDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setForm(draft);
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.values(form).some((value) => value.trim() !== "")) {
        localStorage.setItem("campaignDraft", JSON.stringify(form));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [form]);

  // Update progress step based on form completion and wallet status
  useEffect(() => {
    if (!address) {
      setCurrentStep(0);
    } else if (
      !form.title ||
      !form.description ||
      !form.target ||
      !form.deadline
    ) {
      setCurrentStep(1);
    } else if (Object.keys(formErrors).length > 0) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  }, [address, form, formErrors]);

  // Form validation function
  const validateForm = () => {
    const errors = {};

    // Required field validation
    if (!form.name?.trim()) errors.name = "Name is required";
    if (!form.title?.trim()) errors.title = "Title is required";
    if (!form.description?.trim())
      errors.description = "Description is required";

    // Target amount validation
    const target = parseFloat(form.target);
    if (!form.target || isNaN(target) || target <= 0) {
      errors.target = "Target must be a positive number";
    } else if (target > 1000) {
      errors.target = "Target amount seems unusually high (>1000 ETH)";
    } else if (target < 0.001) {
      errors.target = "Target amount too small (minimum 0.001 ETH)";
    }

    // Date validation
    if (!form.deadline) {
      errors.deadline = "Deadline is required";
    } else {
      const deadline = new Date(form.deadline);
      const now = new Date();
      const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      if (deadline <= minDate) {
        errors.deadline = "Campaign must run for at least 24 hours";
      } else if (deadline > maxDate) {
        errors.deadline = "Campaign duration cannot exceed 1 year";
      }
    }

    // URL validation
    if (form.image && form.image.trim()) {
      try {
        new URL(form.image);
      } catch {
        errors.image = "Please provide a valid image URL";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Real-time form validation
  useEffect(() => {
    if (Object.values(form).some((value) => value.trim() !== "")) {
      validateForm();
    }
  }, [form]);

  // Gas estimation
  useEffect(() => {
    const estimateGas = async () => {
      if (
        address &&
        form.title &&
        form.target &&
        form.deadline &&
        Object.keys(formErrors).length === 0
      ) {
        try {
          const cost = await estimateGasCost({
            ...form,
            target: ethers.utils.parseUnits(form.target, 18),
          });
          setGasCost(cost);
        } catch (error) {
          console.error("Gas estimation failed:", error);
          setGasCost("Unable to estimate");
        }
      }
    };

    const debounceTimer = setTimeout(estimateGas, 1000);
    return () => clearTimeout(debounceTimer);
  }, [address, form, formErrors, estimateGasCost]);

  const handleFormFieldChange = (fieldName, e) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  const clearDraft = () => {
    localStorage.removeItem("campaignDraft");
  };

  const handleNetworkSwitch = async () => {
    try {
      await switchToSepolia();
    } catch (error) {
      alert(`Failed to switch network: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form submitted with data:", form);
    console.log("Current address:", address);
    console.log("Current chain:", chain);

    // Validate form first
    if (!validateForm()) {
      alert("Please fix the form errors before submitting");
      return;
    }

    // Check if we're on the correct network (Sepolia)
    if (chain?.chainId !== 11155111) {
      const shouldSwitch = window.confirm(
        "You're not on Sepolia testnet. Would you like to switch networks automatically?"
      );
      if (shouldSwitch) {
        try {
          await handleNetworkSwitch();
        } catch (error) {
          return; // Stop execution if network switch fails
        }
      } else {
        alert("Please switch to Sepolia testnet to create a campaign");
        return;
      }
    }

    // Check if wallet is connected
    if (!address) {
      try {
        console.log("No address found, attempting to connect wallet...");
        setIsLoading(true);
        await connectWallet();
        console.log("Wallet connected successfully");
      } catch (err) {
        console.error("Wallet connection failed:", err);
        alert(`Failed to connect wallet: ${err.message}`);
        setIsLoading(false);
        return;
      }
    }

    // Check if contract is still loading
    if (contractLoading) {
      alert("Contract is still loading. Please wait a moment and try again.");
      return;
    }

    // Check for contract errors
    if (contractError) {
      alert(`Contract error: ${contractError.message}`);
      return;
    }

    // Check for network errors
    if (networkError) {
      alert(`Network error: ${networkError}`);
      return;
    }

    // Image validation
    if (form.image && form.image.trim()) {
      checkIfImage(form.image, async (exists) => {
        if (exists) {
          await createCampaignTransaction();
        } else {
          alert("Please provide a valid image URL");
          setForm({ ...form, image: "" });
        }
      });
    } else {
      await createCampaignTransaction();
    }
  };

  const createCampaignTransaction = async () => {
    setIsLoading(true);
    try {
      console.log("Creating campaign with processed data:", {
        name: form.name,
        title: form.title,
        description: form.description,
        target: form.target,
        targetInWei: ethers.utils.parseUnits(form.target, 18).toString(),
        deadline: form.deadline,
        deadlineTimestamp: new Date(form.deadline).getTime(),
        image: form.image,
      });

      const result = await createCampaign({
        ...form,
        target: ethers.utils.parseUnits(form.target, 18),
      });

      console.log("Campaign created successfully:", result);

      // Clear draft and form
      clearDraft();
      setForm({
        name: "",
        title: "",
        description: "",
        target: "",
        deadline: "",
        image: "",
      });

      // Success message
      alert("Campaign created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Campaign creation failed:", error);
      alert(`Failed to create campaign: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#1c1c24] flex justify-center items-center flex-col rounded-[10px] sm:p-10 p-4">
      {isLoading && <LoadingOverlay message="Creating your campaign..." />}

      <div className="flex justify-center items-center p-[16px] sm:min-w-[380px] bg-[#3a3a43] rounded-[10px]">
        <h1 className="font-epilogue font-bold sm:text-[25px] text-[18px] leading-[38px] text-white">
          Start a Campaign 🚀
        </h1>
      </div>

      <div className="w-full mt-[40px]">
        <ProgressSteps currentStep={currentStep} />
      </div>

      {/* Connection Status */}
      <div className="w-full mt-[20px] p-4 bg-[#3a3a43] rounded-[10px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-epilogue text-white">
              Status:{" "}
              {address
                ? `Connected (${address.slice(0, 6)}...${address.slice(-4)})`
                : "Not Connected"}
            </p>
            {chain && (
              <p className="font-epilogue text-sm text-gray-400">
                Network: {chain.name}{" "}
                {chain.chainId !== 11155111 && "⚠️ Switch to Sepolia"}
              </p>
            )}
          </div>
          {!address && (
            <CustomButton
              btnType="button"
              title={isConnecting ? "Connecting..." : "Connect Wallet"}
              styles="bg-[#1dc071]"
              handleClick={connectWallet}
              disabled={isConnecting}
            />
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full mt-[65px] flex flex-col gap-[30px]"
      >
        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Your Name *"
            placeholder="John Doe"
            inputType="text"
            value={form.name}
            handleChange={(e) => handleFormFieldChange("name", e)}
            error={formErrors.name}
          />
          <FormField
            labelName="Campaign Title *"
            placeholder="Write a title"
            inputType="text"
            value={form.title}
            handleChange={(e) => handleFormFieldChange("title", e)}
            error={formErrors.title}
          />
        </div>

        <FormField
          labelName="Story *"
          placeholder="Write your story"
          isTextArea
          value={form.description}
          handleChange={(e) => handleFormFieldChange("description", e)}
          error={formErrors.description}
        />

        {/* Enhanced Banner Part */}
        <div className="w-full relative overflow-hidden">
          {/* Main Banner Container */}
          <div className="relative flex justify-start items-center p-6 bg-gradient-to-r from-[#8c6dfd] via-[#7c5ffc] to-[#6b4ce6] h-[140px] rounded-2xl shadow-2xl">
            {/* Background Pattern/Decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 right-8 w-32 h-32 bg-white rounded-full blur-3xl"></div>
              <div className="absolute -bottom-8 -right-4 w-24 h-24 bg-white rounded-full blur-2xl"></div>
              <div className="absolute top-0 left-1/2 w-16 h-16 bg-white rounded-full blur-xl"></div>
            </div>

            {/* Animated Border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#8c6dfd] to-[#6b4ce6] opacity-75 animate-pulse"></div>

            {/* Content Container */}
            <div className="relative z-10 flex items-center">
              {/* Icon Container with Animation */}
              <div className="relative mr-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex justify-center items-center backdrop-blur-sm border border-white/30 shadow-lg transform hover:scale-110 transition-all duration-300">
                  <img
                    src={money}
                    alt="money"
                    className="w-8 h-8 object-contain filter brightness-0 invert animate-pulse"
                  />
                </div>
                {/* Floating particles effect */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
              </div>

              {/* Text Content */}
              <div className="flex-1">
                <h4 className="font-epilogue font-bold text-[28px] text-white leading-tight mb-1 drop-shadow-lg">
                  You will get{" "}
                  <span className="text-yellow-300 text-[32px] font-black animate-pulse">
                    100%
                  </span>{" "}
                  of the raised amount
                </h4>
                <p className="text-white/80 text-sm font-medium">
                  No platform fees • Direct to your wallet • Instant transfers
                </p>
              </div>

              {/* Success Badge */}
              <div className="hidden sm:flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm font-semibold text-white">
                  Fee-Free
                </span>
              </div>
            </div>

            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 animate-shimmer"></div>
          </div>

          {/* Bottom highlight line */}
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#8c6dfd] to-transparent mt-1 rounded-full opacity-50"></div>
        </div>

        <div className="flex flex-wrap gap-[40px]">
          <FormField
            labelName="Goal *"
            placeholder="ETH 0.50"
            inputType="text"
            value={form.target}
            handleChange={(e) => handleFormFieldChange("target", e)}
            error={formErrors.target}
          />
          <FormField
            labelName="End Date *"
            placeholder="End Date"
            inputType="date"
            value={form.deadline}
            handleChange={(e) => handleFormFieldChange("deadline", e)}
            error={formErrors.deadline}
          />
        </div>

        <FormField
          labelName="Campaign image"
          placeholder="Place image URL of your campaign"
          inputType="url"
          value={form.image}
          handleChange={(e) => handleFormFieldChange("image", e)}
          error={formErrors.image}
        />

        {/* Gas Estimation */}
        {gasCost && (
          <div className="p-4 bg-[#3a3a43] rounded-[10px]">
            <p className="font-epilogue text-white">
              Estimated Gas Cost:{" "}
              <span className="text-[#1dc071]">{gasCost} ETH</span>
            </p>
          </div>
        )}

        {/* Form validation summary */}
        {Object.keys(formErrors).length > 0 && (
          <div className="p-4 bg-red-900 bg-opacity-20 border border-red-500 rounded-[10px]">
            <p className="font-epilogue text-red-400 mb-2">
              Please fix the following errors:
            </p>
            <ul className="list-disc list-inside text-red-300 text-sm">
              {Object.values(formErrors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Form submit button */}
        <div className="flex justify-center items-center mt-[40px]">
          <CustomButton
            btnType="submit"
            title="Submit new campaign"
            styles="bg-[#1dc071]"
            disabled={
              !address || contractLoading || Object.keys(formErrors).length > 0
            }
          />
        </div>
      </form>
    </div>
  );
};

export default CreateCampaign;
