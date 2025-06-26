import React from 'react';
import styled from 'styled-components';

const ExportButton = () => {
  return (
    <StyledWrapper>
      <button className="action_has has_saved" aria-label="save" type="button">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width={20} height={20} strokeLinejoin="round" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24" stroke="currentColor" fill="none">
          <path d="m19,21H5c-1.1,0-2-.9-2-2V5c0-1.1.9-2,2-2h11l5,5v11c0,1.1-.9,2-2,2Z" strokeLinejoin="round" strokeLinecap="round" data-path="box" />
          <path d="M7 3L7 8L15 8" strokeLinejoin="round" strokeLinecap="round" data-path="line-top" />
          <path d="M17 20L17 13L7 13L7 20" strokeLinejoin="round" strokeLinecap="round" data-path="line-bottom" />
        </svg>
      </button>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .action_has {
    --color: 0 0% 60%;
    --color-has: 211deg 100% 48%;
    --sz: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(var(--sz) * 2.5);
    width: calc(var(--sz) * 2.5);
    padding: 0.4rem 0.5rem;
    border-radius: 0.375rem;
    border: 0.0625rem solid hsl(var(--color));
  }

  .has_saved:hover {
    border-color: hsl(var(--color-has));
  }
  .has_liked:hover svg,
  .has_saved:hover svg {
    color: hsl(var(--color-has));
  }`;

export default ExportButton;
