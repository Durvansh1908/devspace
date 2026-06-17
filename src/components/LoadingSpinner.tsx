import React from "react";
import "./LoadingSpinner.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullscreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message,
  fullscreen = false,
}) => {
  const baseClass = fullscreen ? "loading-spinner-fullscreen" : "loading-spinner";

  return (
    <div className={baseClass}>
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-dot" />
        <div className="spinner-dot" />
        <div className="spinner-dot" />
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingSpinner size="large" message={message || "Loading..."} fullscreen />
);

export const InlineLoader: React.FC<{ message?: string }> = ({ message }) => (
  <LoadingSpinner size="small" message={message} />
);
