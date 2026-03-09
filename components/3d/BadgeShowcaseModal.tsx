'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Center } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import BadgeModel from '@/components/3d/BadgeModel';

interface BadgeShowcaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    glbPath: string | null;
    glowColor: string | null;
    badgeName: string;
    privilege?: string;
}

export default function BadgeShowcaseModal({
    isOpen,
    onClose,
    glbPath,
    glowColor,
    badgeName,
    privilege,
}: BadgeShowcaseModalProps) {
    return (
        <AnimatePresence>
            {isOpen && glbPath && glowColor && (
                <motion.div
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={onClose}
                >
                    <div
                        className="relative w-full max-w-5xl aspect-square md:aspect-video flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-10 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>

                        <div className="absolute top-10 left-0 w-full text-center z-10 pointer-events-none">
                            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 tracking-wider">
                                {badgeName}
                            </h2>
                            {privilege && (
                                <p className="text-white/40 mt-2 uppercase tracking-widest text-sm">
                                    {privilege}
                                </p>
                            )}
                        </div>

                        <Canvas
                            shadows
                            camera={{ position: [0, 0, 6], fov: 45 }}
                            gl={{ antialias: true, alpha: true }}
                        >
                            <Suspense fallback={null}>
                                <ambientLight intensity={1.0} />
                                <directionalLight position={[5, 8, 5]} intensity={1.5} />
                                <directionalLight position={[-3, -2, 4]} intensity={0.5} />
                                <spotLight position={[10, 10, 10]} intensity={1.5} angle={0.3} penumbra={1} castShadow />
                                <Environment preset="studio" />
                                <Center>
                                    <BadgeModel glbPath={glbPath} glowColor={glowColor} />
                                </Center>
                                <OrbitControls
                                    enablePan={false}
                                    enableZoom={true}
                                    minDistance={3}
                                    maxDistance={10}
                                    autoRotate
                                    autoRotateSpeed={1.5}
                                    enableDamping={true}
                                    dampingFactor={0.05}
                                />
                            </Suspense>
                        </Canvas>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
