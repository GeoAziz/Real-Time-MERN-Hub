import mongoose from 'mongoose';
const connectToMongoDB = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri).then(() => {
      console.log('Connected to MongoDB successfully');
    });
  } catch (error) {
    console.log(`Error Connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
export default connectToMongoDB;
