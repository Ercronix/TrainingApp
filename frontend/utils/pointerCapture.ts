// react-native-gesture-handler's web pointer tracker calls releasePointerCapture on
// every pointerup without checking that the element still holds the capture.
// Firefox throws "Invalid pointer id" when the pointer is no longer active
// (e.g. the capture was already lost), which surfaces as an uncaught error.
// Releasing a capture the element doesn't hold is a no-op per spec, so skip it.
if (typeof Element !== 'undefined') {
  const release = Element.prototype.releasePointerCapture;
  Element.prototype.releasePointerCapture = function (pointerId: number) {
    if (this.hasPointerCapture(pointerId)) release.call(this, pointerId);
  };
}

export {};
