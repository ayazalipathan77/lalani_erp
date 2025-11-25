
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Image as ImageIcon, Download, AlertCircle, Key, Loader2 } from 'lucide-react';

const Marketing: React.FC = () => {
  const [apiKeySet, setApiKeySet] = useState(false);
  const [prompt, setPrompt] = useState('A sleek, modern tire advertisement with a dark luxury background, studio lighting, high resolution.');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if API key is selected on mount
  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySet(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleConnectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      const selected = await window.aistudio.openSelectKey();
      // Assume success if dialog closes, verify with hasSelectedApiKey in a real scenario
      // or rely on state update. Race condition mitigation:
      setApiKeySet(true);
    }
  };

  const handleGenerate = async () => {
    if (!apiKeySet) {
      setError("Please connect your Google AI account first.");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Create instance right before call to ensure key is present
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9", // Default to commercial landscape
            imageSize: imageSize
          },
        },
      });

      // Extract image
      let foundImage = false;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64EncodeString}`;
            setGeneratedImage(imageUrl);
            foundImage = true;
            break;
          }
        }
      }
      
      if (!foundImage) {
        throw new Error("No image generated in the response.");
      }

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
        // Reset key if invalid
        setApiKeySet(false);
        setError("API Key invalid or expired. Please reconnect.");
      } else {
        setError(err.message || "Failed to generate image.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-600" />
            Marketing Studio
          </h1>
          <p className="text-slate-500">Generate high-quality promotional assets using AI.</p>
        </div>
      </div>

      {!apiKeySet ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
           <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
           </div>
           <h2 className="text-xl font-bold text-slate-900 mb-2">Connect Google AI</h2>
           <p className="text-slate-500 max-w-md mx-auto mb-6">
             To generate premium marketing images with Gemini 3 Pro, you need to connect your paid Google Cloud project API key.
           </p>
           <button 
             onClick={handleConnectKey}
             className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30"
           >
             Connect Account
           </button>
           <p className="mt-4 text-xs text-slate-400">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">
               View Billing Documentation
             </a>
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4">Image Settings</h3>
               
               <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Prompt</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-brand-500 focus:border-brand-500 h-32 resize-none"
                      placeholder="Describe the image you want to generate..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quality / Size</label>
                    <div className="grid grid-cols-3 gap-2">
                       {(['1K', '2K', '4K'] as const).map((size) => (
                         <button
                           key={size}
                           onClick={() => setImageSize(size)}
                           className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                             imageSize === size 
                               ? 'bg-brand-50 border-brand-500 text-brand-700' 
                               : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                           }`}
                         >
                           {size}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleGenerate}
                   disabled={loading || !prompt.trim()}
                   className="w-full bg-brand-600 text-white py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                   {loading ? (
                     <>
                       <Loader2 className="w-5 h-5 animate-spin" />
                       Generating...
                     </>
                   ) : (
                     <>
                       <Sparkles className="w-5 h-5" />
                       Generate Asset
                     </>
                   )}
                 </button>

                 {error && (
                   <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      {error}
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900">Preview</h3>
                  {generatedImage && (
                    <a 
                      href={generatedImage} 
                      download={`lalani-promo-${Date.now()}.png`}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  )}
                </div>

                <div className="flex-1 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
                   {loading ? (
                     <div className="text-center">
                        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 font-medium">Creating masterpiece...</p>
                        <p className="text-xs text-slate-400 mt-1">This may take a few seconds</p>
                     </div>
                   ) : generatedImage ? (
                     <img 
                       src={generatedImage} 
                       alt="Generated Asset" 
                       className="w-full h-full object-contain"
                     />
                   ) : (
                     <div className="text-center text-slate-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Generated image will appear here</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketing;
