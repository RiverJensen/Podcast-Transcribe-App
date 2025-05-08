const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Table name for transcriptions
const TRANSCRIPTIONS_TABLE = 'transcriptions';

/**
 * Service for managing transcription data with Supabase
 */
const transcriptionService = {
  /**
   * Save a new transcription
   * @param {Object} transcriptionData Transcription data without ID
   * @returns {Promise<Object>} Saved transcription with ID
   */
  async saveTranscription(transcriptionData) {
    try {
      // Generate a unique ID if not provided
      const transcription = {
        id: transcriptionData.id || uuidv4(),
        ...transcriptionData,
        created_at: new Date().toISOString()
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from(TRANSCRIPTIONS_TABLE)
        .insert(transcription)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`Transcription saved with ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('Error saving transcription:', error.message);
      throw error;
    }
  },

  /**
   * Get all transcriptions with optional filtering
   * @param {Object} filters Optional filters (e.g., { source_type: 'youtube' })
   * @returns {Promise<Array>} List of transcriptions
   */
  async getAllTranscriptions(filters = {}) {
    try {
      let query = supabase
        .from(TRANSCRIPTIONS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      // Apply any filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query;

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting transcriptions:', error.message);
      throw error;
    }
  },

  /**
   * Get a single transcription by ID
   * @param {string} id Transcription ID
   * @returns {Promise<Object>} Transcription data
   */
  async getTranscription(id) {
    try {
      const { data, error } = await supabase
        .from(TRANSCRIPTIONS_TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // PGRST116 is the error code for "no rows returned"
          return null;
        }
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error(`Error getting transcription ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Delete a transcription by ID
   * @param {string} id Transcription ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTranscription(id) {
    try {
      const { error } = await supabase
        .from(TRANSCRIPTIONS_TABLE)
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      console.log(`Transcription ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error(`Error deleting transcription ${id}:`, error.message);
      throw error;
    }
  },

  /**
   * Search transcriptions by text content
   * @param {string} searchTerm Search term
   * @returns {Promise<Array>} Matching transcriptions
   */
  async searchTranscriptions(searchTerm) {
    try {
      const { data, error } = await supabase
        .from(TRANSCRIPTIONS_TABLE)
        .select('*')
        .textSearch('text', searchTerm)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching transcriptions:', error.message);
      throw error;
    }
  }
};

module.exports = transcriptionService; 