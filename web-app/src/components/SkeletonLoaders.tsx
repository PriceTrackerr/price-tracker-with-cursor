import React from 'react';

interface ProductCardSkeletonProps {
    count?: number;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ count = 6 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
                >
                    {/* Image skeleton */}
                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>

                    {/* Title skeleton */}
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>

                    {/* Platform badge skeleton */}
                    <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>

                    {/* Price skeleton */}
                    <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>

                    {/* Buttons skeleton */}
                    <div className="flex gap-2">
                        <div className="h-9 bg-gray-200 rounded flex-1"></div>
                        <div className="h-9 bg-gray-200 rounded w-9"></div>
                    </div>
                </div>
            ))}
        </>
    );
};

export const TableRowSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <tr key={index} className="border-b border-gray-100 animate-pulse">
                    <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="h-5 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="py-4 px-6">
                        <div className="flex gap-2">
                            <div className="h-8 bg-gray-200 rounded w-8"></div>
                            <div className="h-8 bg-gray-200 rounded w-8"></div>
                            <div className="h-8 bg-gray-200 rounded w-8"></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );
};

export const DashboardCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-40"></div>
        </div>
    );
};

export const PageLoader: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        </div>
    );
};
