import images from "./images";
import typography from "./typography";

export { images, typography };

export const onboardingText = [
  {
    id: 1,
    title: "ESNYCA YOUTH CORNER",
    description: "Connecting talent with local employment and practical skills",
    image: images.slide1,
  },
  {
    id: 2,
    title: "COLLABORATIVE LEARNING",
    description: "A platform to share and gain knowledge with peers",
    image: images.slide2,
  },
  {
    id: 3,
    title: "SKILL DEVELOPMENT",
    description: "Helping youth acquire hands-on experience",
    image: images.slide3,
  },
];

export const data = {
  onboardingText,
};

export const signInFormControls = [
  {
    name: "userEmail",
    label: "Email",
    placeholder: "Enter your email",
    type: "email",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Enter your password",
    type: "password",
  },
];

export const signUpFormControls = [
  {
    name: "userName",
    label: "Username",
    placeholder: "Enter your username",
    type: "text",
  },
  {
    name: "userEmail",
    label: "Email",
    placeholder: "Enter your email",
    type: "email",
  },
  {
    name: "phoneNumber",
    label: "Phone Number",
    placeholder: "Enter your phone number",
    type: "tel",
  },
  {
    name: "password",
    label: "Password",
    placeholder: "Create a password",
    type: "password",
  },
];
