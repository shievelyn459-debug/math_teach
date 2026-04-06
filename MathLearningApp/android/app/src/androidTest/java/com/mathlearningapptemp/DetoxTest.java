package com.mathlearningapptemp;

import com.wix.detox.Detox;
import com.wix.detox.config.DetoxConfig;

import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;

import androidx.test.ext.junit.runners.AndroidJUnit4;

/**
 * Detox test runner configuration
 * This file is required by Detox to initialize the test framework
 */
@RunWith(AndroidJUnit4.class)
public class DetoxTest {
    @BeforeClass
    public static void setup() {
        DetoxConfig detoxConfig = new DetoxConfig();
        detoxConfig.idleTimeoutMs = 60000;
        detoxConfig.rnReloadTimeoutMs = 60000;
        Detox.init(detoxConfig);
    }

    @Test
    public void detoxInit() {
        // Detox will handle the test execution
    }
}
