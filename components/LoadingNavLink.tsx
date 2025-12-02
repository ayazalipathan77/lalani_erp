import React from 'react';
import { NavLink, NavLinkProps } from 'react-router-dom';

interface LoadingNavLinkProps extends NavLinkProps {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent) => void;
}

const LoadingNavLink: React.FC<LoadingNavLinkProps> = ({ children, onClick, ...props }) => {
    const handleClick = (e: React.MouseEvent) => {
        // If there's a custom onClick handler, call it
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <NavLink
            {...props}
            onClick={handleClick}
        >
            {children}
        </NavLink>
    );
};

export default LoadingNavLink;