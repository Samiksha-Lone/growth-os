import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}
