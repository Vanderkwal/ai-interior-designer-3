/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo } from 'react';
import Spinner from './Spinner';
import { AnimatePresence, motion } from 'framer-motion';
import { DownloadIcon, HomeIcon, RedoIcon, ShareIcon, Trash2Icon, UndoIcon, EyeIcon, EyeOffIcon } from './icons';

interface CanvasProps {
  originalImage: string;
  currentImage: string;
  history: string[];
  currentHistoryIndex: number;
  onApplyChange: (prompt: string, message: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onStartOver: () => void;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

const DESIGN_PALETTES = {
  "Warm Neutrals": "a cozy and inviting palette of beige, cream, and soft browns.",
  "Cool Modern": "a sleek and modern palette of gray, white, and cool blue accents.",
  "Earth Tones": "a natural and grounding palette of terracotta, olive green, and rich wood tones.",
};

const MATERIAL_TEXTURES = {
  "Wood Grain": "Apply a wood grain texture to the flooring.",
  "Marble": "Apply a luxurious marble texture to a prominent surface.",
  "Concrete": "Change the flooring to polished concrete.",
  "Fabric": "Change the material of the main sofa to a cozy fabric texture.",
};

const DESIGNER_FURNITURE = {
  "Ligne Roset Togo": "Add a Ligne Roset Togo sofa set.",
  "Vitra Living Set": "Add a Vitra Eames Lounge Chair and Ottoman.",
  "Muuto Dining Chairs": "Replace the dining chairs with Muuto Fiber Armchairs.",
  "Molteni Bedroom Set": "Add a Molteni&C bedroom set, including a modern bed and nightstands.",
  "Poliform Sofa Collection": "Replace the sofa with a modular Poliform sofa.",
  "Cassina Lounge Piece": "Add a Cassina LC4 chaise lounge.",
};

// Compare Slider Component
const CompareSlider: React.FC<{ beforeImage: string; afterImage: string }> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative w-full h-full overflow-hidden select-none group rounded-xl">
      <img
        src={afterImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      <img
        src={beforeImage}
        alt="Before"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        draggable={false}
      />
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full cursor-col-resize appearance-none bg-transparent focus:outline-none
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-full [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:bg-white/80
                   [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-full [&::-moz-range-thumb]:w-1 [&::-moz-range-thumb]:bg-white/80"
      />
      <div 
        className="absolute top-0 bottom-0 bg-white/80 w-1 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      ></div>
      <div className="absolute top-2 left-4 px-3 py-1 bg-black/50 text-white text-xs font-semibold rounded-full pointer-events-none">BEFORE</div>
      <div className="absolute top-2 right-4 px-3 py-1 bg-black/50 text-white text-xs font-semibold rounded-full pointer-events-none">AFTER</div>
    </div>
  );
};


const Canvas: React.FC<CanvasProps> = ({ originalImage, currentImage, history, currentHistoryIndex, onApplyChange, onUndo, onRedo, onStartOver, isLoading, loadingMessage, error }) => {
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareSource, setCompareSource] = useState<'original' | 'previous'>('original');
  const [refinePrompt, setRefinePrompt] = useState('');
  const [objectToReplace, setObjectToReplace] = useState('');
  const [replacementObject, setReplacementObject] = useState('');

  const canUndo = currentHistoryIndex > 0;
  const canRedo = currentHistoryIndex < history.length - 1;

  const compareImage = useMemo(() => {
    if (compareSource === 'original') {
      return originalImage;
    }
    return history[currentHistoryIndex - 1] ?? originalImage;
  }, [compareSource, originalImage, history, currentHistoryIndex]);

  const handleRefine = () => {
    if (!refinePrompt.trim() || isLoading) return;
    onApplyChange(refinePrompt, 'Refining your design...');
    setRefinePrompt('');
  };

  const handleReplaceObject = () => {
    if (!objectToReplace.trim() || !replacementObject.trim() || isLoading) return;
    const prompt = `Replace ${objectToReplace} with ${replacementObject}.`;
    const message = `Replacing ${objectToReplace}...`;
    onApplyChange(prompt, message);
    setObjectToReplace('');
    setReplacementObject('');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `design-${new Date().toISOString()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShare = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const file = new File([blob], `design-${Date.now()}.png`, { type: blob.type });

      if (navigator.share) {
        await navigator.share({
          title: 'My AI Interior Design',
          text: 'Check out this room design I created!',
          files: [file],
        });
      } else {
        await navigator.clipboard.write([
            new ClipboardItem({[blob.type]: blob})
        ]);
        alert('Image copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
      alert('Sharing is not supported on this browser or an error occurred.');
    }
  };
  
  const ControlButton: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode; 'aria-label': string, title: string }> = ({ children, ...props }) => (
    <button {...props} className="p-2 rounded-lg bg-white/80 backdrop-blur-md border border-gray-200/80 shadow-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {children}
    </button>
  );

  return (
    <main className="flex flex-col md:flex-row h-screen w-full bg-[#f5f5f5]">
      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-8 relative">
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <ControlButton onClick={onStartOver} aria-label="New Room" title="New Room"><HomeIcon className="w-5 h-5 text-gray-700" /></ControlButton>
        </div>
        
        <div className="w-full flex-grow max-w-6xl max-h-[75vh] relative flex items-center justify-center">
            {isCompareMode ? (
                <CompareSlider beforeImage={compareImage} afterImage={currentImage} />
            ) : (
                <img
                key={currentImage}
                src={currentImage}
                alt="Generated interior design"
                className="max-w-full max-h-full object-contain rounded-xl shadow-lg animate-fade-in"
                />
            )}
             <AnimatePresence>
                {isLoading && (
                    <motion.div
                        className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Spinner />
                        {loadingMessage && (
                            <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="mt-4 w-full max-w-2xl">
          <label htmlFor="refine-prompt" className="block text-sm font-medium text-gray-700 mb-1">Refine this design</label>
          <div className="flex items-center gap-2">
              <input
                  id="refine-prompt"
                  type="text"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  placeholder="e.g., make the walls lighter, add curtains"
                  className="flex-grow p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-gray-800 focus:border-gray-800"
                  disabled={isLoading}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
              />
              <button
                  onClick={handleRefine}
                  disabled={isLoading || !refinePrompt.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  aria-label="Refine design"
              >
                  Refine
              </button>
          </div>
        </div>
        
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <ControlButton onClick={handleDownload} aria-label="Download" title="Download"><DownloadIcon className="w-5 h-5 text-gray-700" /></ControlButton>
            <ControlButton onClick={handleShare} aria-label="Share" title="Share"><ShareIcon className="w-5 h-5 text-gray-700" /></ControlButton>
            <div className="h-px bg-gray-300 my-1"></div>
            <ControlButton onClick={onUndo} disabled={!canUndo || isLoading} aria-label="Undo" title="Undo"><UndoIcon className="w-5 h-5 text-gray-700" /></ControlButton>
            <ControlButton onClick={onRedo} disabled={!canRedo || isLoading} aria-label="Redo" title="Redo"><RedoIcon className="w-5 h-5 text-gray-700" /></ControlButton>
            <div className="h-px bg-gray-300 my-1"></div>
            <ControlButton onClick={onStartOver} aria-label="Start Over" title="Start Over"><Trash2Icon className="w-5 h-5 text-gray-700" /></ControlButton>
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 bg-white/80 backdrop-blur-md rounded-lg border border-gray-200/80 shadow-sm">
          <ControlButton onClick={() => setIsCompareMode(!isCompareMode)} aria-label={isCompareMode ? "Disable Compare Mode" : "Enable Compare Mode"} title={isCompareMode ? "Disable Compare Mode" : "Enable Compare Mode"}>
            {isCompareMode ? <EyeOffIcon className="w-5 h-5 text-gray-700"/> : <EyeIcon className="w-5 h-5 text-gray-700" />}
          </ControlButton>
          {isCompareMode && (
            <select value={compareSource} onChange={(e) => setCompareSource(e.target.value as 'original' | 'previous')} className="text-sm bg-transparent border-none focus:ring-0 rounded-md" disabled={currentHistoryIndex === 0}>
              <option value="original">vs Original Upload</option>
              <option value="previous" disabled={currentHistoryIndex === 0}>vs Previous Generation</option>
            </select>
          )}
        </div>
      </div>

      {/* Side Panel */}
      <aside className="w-full md:w-80 flex-shrink-0 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <div className="flex flex-col gap-8">
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                <p className="font-bold">Error</p>
                <p>{error}</p>
                </div>
            )}
            
            <div>
              <h3 className="font-serif text-lg text-gray-800 mb-3">Apply a Color Palette</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(DESIGN_PALETTES).map(([name, prompt]) => (
                  <button key={name} disabled={isLoading} onClick={() => onApplyChange(`Apply a color palette described as: ${prompt}`, `Applying ${name} palette...`)} className="w-full text-left text-sm font-medium text-gray-800 p-3 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-serif text-lg text-gray-800 mb-3">Change Material Textures</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(MATERIAL_TEXTURES).map(([name, prompt]) => (
                  <button key={name} disabled={isLoading} onClick={() => onApplyChange(prompt, `Applying ${name} texture...`)} className="w-full text-left text-sm font-medium text-gray-800 p-3 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                    {name}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-serif text-lg text-gray-800 mb-3">Add Designer Furniture</h3>
              <div className="grid grid-cols-1 gap-2">
                 {Object.entries(DESIGNER_FURNITURE).map(([name, prompt]) => (
                  <button key={name} disabled={isLoading} onClick={() => onApplyChange(prompt, `Adding ${name}...`)} className="w-full text-left text-sm font-medium text-gray-800 p-3 rounded-md border border-gray-300 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-serif text-lg text-gray-800 mb-3">Replace an Object</h3>
              <div className="flex flex-col gap-4">
                  <div>
                      <label htmlFor="object-to-replace" className="block text-sm font-medium text-gray-700 mb-1">Object to replace</label>
                      <input
                          id="object-to-replace"
                          type="text"
                          value={objectToReplace}
                          onChange={(e) => setObjectToReplace(e.target.value)}
                          placeholder="e.g., the sofa, the floor lamp"
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-800 focus:border-gray-800"
                          disabled={isLoading}
                      />
                  </div>
                  <div>
                      <label htmlFor="replacement-object" className="block text-sm font-medium text-gray-700 mb-1">Replace with</label>
                      <input
                          id="replacement-object"
                          type="text"
                          value={replacementObject}
                          onChange={(e) => setReplacementObject(e.target.value)}
                          placeholder="e.g., a modern sectional, an arc lamp"
                          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-gray-800 focus:border-gray-800"
                          disabled={isLoading}
                      />
                  </div>
                  <button
                      onClick={handleReplaceObject}
                      disabled={isLoading || !objectToReplace.trim() || !replacementObject.trim()}
                      className="w-full px-5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                      Replace Object
                  </button>
              </div>
            </div>

        </div>
      </aside>
    </main>
  );
};

export default Canvas;