/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons';

interface StartScreenProps {
  onGenerate: (imageFile: File, prompt: string) => void;
  error: string | null;
}

const DESIGN_STYLES = {
  "Modern Farmhouse": "A modern farmhouse interior with neutral colors, natural wood accents, and cozy textiles.",
  "Industrial Loft": "An industrial loft style with exposed brick, metal fixtures, and open spaces.",
  "Bohemian Chic": "A bohemian chic design with eclectic patterns, lush plants, and a relaxed, layered look.",
  "Minimalist": "A minimalist interior with clean lines, a monochromatic palette, and uncluttered spaces.",
  "Art Deco": "An elegant Art Deco style featuring bold geometric patterns, luxurious materials, and rich colors.",
  "Rustic": "A rustic design with rough-hewn wood, stone elements, and a warm, earthy color scheme.",
  "Scandinavian": "A Scandinavian interior characterized by simplicity, functionality, and natural light.",
  "Japandi": "A Japandi style, blending Japanese minimalism with Scandinavian functionality, using natural materials and a calm color palette.",
  "Retro Revival": "A retro revival design with bold colors, vintage furniture, and playful patterns from the 60s or 70s.",
};

const StartScreen: React.FC<StartScreenProps> = ({ onGenerate, error }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setLocalError('Please select a valid image file.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setLocalError(null);
    }
  };

  const handleGenerateClick = () => {
    if (!imageFile) {
      setLocalError('Please upload an image of your room.');
      return;
    }
    if (!prompt.trim()) {
      setLocalError('Please provide a design prompt or select a style.');
      return;
    }
    setLocalError(null);
    onGenerate(imageFile, prompt);
  };
  
  const handleStyleClick = (stylePrompt: string) => {
    setPrompt(stylePrompt);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
          AI Interior Designer
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Upload a photo of your room and describe your dream design.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left Side: Upload and Prompt */}
        <div className="flex flex-col gap-6">
          <label htmlFor="room-upload" className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors relative overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Room preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <UploadCloudIcon className="w-10 h-10 mb-2" />
                <span className="font-semibold">Click to upload a room photo</span>
                <span className="text-sm">PNG, JPG, WEBP recommended</span>
              </>
            )}
            <input id="room-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
          
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Design Prompt</label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-gray-800 focus:border-gray-800"
              placeholder="e.g., A cozy living room with a fireplace and Scandinavian furniture..."
            />
          </div>
        </div>

        {/* Right Side: Style Selection */}
        <div className="flex flex-col">
           <h3 className="font-serif text-lg text-gray-800 mb-3 text-center md:text-left">Or, pick a style...</h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(DESIGN_STYLES).map(([name, stylePrompt]) => (
              <button
                key={name}
                onClick={() => handleStyleClick(stylePrompt)}
                className={`p-2 border rounded-md text-sm text-left transition-colors ${prompt === stylePrompt ? 'bg-gray-800 text-white border-gray-800' : 'bg-white hover:bg-gray-100 border-gray-300'}`}
              >
                {name}
              </button>
            ))}
           </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        {(error || localError) && <p className="text-red-500 text-sm mb-4">{error || localError}</p>}
        <button
          onClick={handleGenerateClick}
          className="px-10 py-3 text-base font-semibold text-white bg-gray-900 rounded-lg shadow-md cursor-pointer hover:bg-gray-700 transition-colors active:scale-95"
        >
          Generate Design
        </button>
      </div>
    </div>
  );
};

export default StartScreen;
