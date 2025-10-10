## 2025-10-10 22:18:21

### 1.  Fix the issue of " " prompt box display on mobile devices

**Change Type**: fix

> **Purpose**: Fix the issue of " " prompt box display position error or unable to display normally on mobile devices when clicking the copy content
> **Detailed Description**: On mobile devices, due to the limitation of container width and text overflow processing, the absolute positioning calculation of tooltip is incorrect. Modified the CSS style, added a special positioning logic for mobile devices, using right alignment instead of center alignment, to avoid exceeding the screen boundary
> **Reason for Change**: User feedback that the " " prompt box cannot be seen on mobile devices, affecting user experience. PC display is normal, but mobile devices have different viewport widths and text processing methods, causing positioning failure
> **Impact Scope**: 
>   - Only affects the display of tooltip on mobile devices (max-width: 768px)
>   - PC display is not affected
>   - Does not affect the copy function itself, only visual feedback
> **API Changes**: No API changes
> **Configuration Changes**: No configuration changes
> **Performance Impact**: No performance impact, only CSS style adjustment

   ```
   root
   - pages                      // -
    - assets                    // -
     - css
      - styles.css              // refact -  Fix the issue of tooltip positioning on mobile devices
        + Add display: inline-block to .ip-value and .copyable-value to ensure positioning
        + Add .copy-tooltip style for mobile devices in @media (max-width: 768px)
          - Use right: 0 instead of left: 50%
          - Remove transform to avoid calculation errors
          - Adjust the position of the arrow to the right side
        + Fix the to part of @keyframes tooltipFade animation (previously truncated unintentionally)
   ```