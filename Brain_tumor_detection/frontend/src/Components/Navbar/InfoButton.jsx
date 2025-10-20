import React from 'react';
import styled from 'styled-components';
import { IoInformationCircle } from "react-icons/io5";

const ExportButton = ({ chat, setShowModalInfo, setInteractChat }) => {

  return (
    <StyledWrapper>
      <button className="action_has has_saved" aria-label="save" type="button" 
        onClick={(e) => {
          setInteractChat(chat)
          setShowModalInfo(true)
        }}>
      <IoInformationCircle />
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
    background: white;
  }

  .has_saved:hover {
    border-color: hsl(var(--color-has));
  }
  .has_liked:hover svg,
  .has_saved:hover svg {
    color: hsl(var(--color-has));
  }`;

export default ExportButton;
