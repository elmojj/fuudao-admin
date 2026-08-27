/*
  (C) Copyright 2023-2024 by Shanghai Huishui Tech Co., LTD.  All rights reserved.

  This computer source code and related instructions and comments are the
  unpublished confidential and proprietary information of Shanghai Huishui
  Tech Co., LTD. and are protected under applicable copyright and trade
  secret law.  They may not be disclosed to, copied or used by any third
  party without the prior written consent of Shanghai Huishui Tech Co., LTD.
*/

import styled, { css } from 'styled-components/macro';

export const SpanClose = styled.span`
  display: block;
  color: ${({ theme }) => theme.colorIcon};
  width: 22px;
  height: 22px;
  background: transparent;
  border-radius: 4px;
  outline: 0;
  border: 0;
  outline: 0;
  text-align: center;
  font-size: 16px;
  line-height: 22px;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
  margin-right: 5px;
  &:hover {
    color: ${({ theme }) => theme.colorIconHover};
    background-color: ${({ theme }) => theme.colorBgTextHover};
  }
`;

export const EllipsisText = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  word-break: break-all;
`;

export const BeforePrefix = css`
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 60%;
  border-radius: 2px;
  background-color: ${({ theme }) => theme.colorPrimary};
  transform: translate(0, -50%);
`;

export const BlinkPoint = styled.span<{
  blink?: boolean;
  color?: string;
}>`
  position: relative;
  color: ${({ theme, color }) => color ?? theme.colorPrimary};
  background-color: ${({ theme, color }) => color ?? theme.colorPrimary};
  top: -1px;
  display: inline-block;
  width: 6px;
  height: 6px;
  vertical-align: middle;
  border-radius: 50%;
  margin: 0 8px 0 2px;

  @keyframes animation-blink-point {
    0% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    100% {
      transform: scale(2.4);
      opacity: 0;
    }
  }

  &::before {
    position: absolute;
    top: 0;
    inset-inline-start: 0;
    width: 100%;
    height: 100%;
    border-width: 1px;
    border-style: solid;
    border-color: inherit;
    border-radius: 50%;
    animation-name: ${({ blink = true }) =>
      blink ? 'animation-blink-point' : null};
    animation-duration: 1.2s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
    content: '';
  }
`;

export const SpecificPrefixH2 = styled.h2`
  position: relative;
  margin: 0;
  font-size: 18px;
  line-height: 18px;
  padding: 3px 0 3px 10px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &::before {
    ${BeforePrefix}
  }
`;

export const PageWrapper = styled.div`
  margin: 20px 20px 0;
`;

export const VerticalFormTitleWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  width: 100vw;
`;

export const EllipsisTextDiv = styled.div`
  ${EllipsisText}
`;
